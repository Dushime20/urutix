import React, { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { fleetApi, type FleetItem } from '../services/fleetApi';
import { fetchTenants, fetchAllUsers } from '../services/adminApi';
import { useAuth } from '../contexts/AuthContext';
import { 
  FaTruck, FaEdit, FaPlus, FaSearch, FaDownload,
  FaEye, FaCheck, FaTimes, FaBan, FaMapMarkerAlt,
  FaSort, FaClock, FaRoad, FaUser, FaBuilding,
  FaShieldAlt, FaExclamationTriangle, FaPlay, FaPause,
  FaTrash, FaWrench, FaGasPump
} from 'react-icons/fa';

interface Truck extends FleetItem {
  tenantId?: string;
  tenantName?: string;
  ownerId?: string;
  ownerName?: string;
  owner?: {
    id: string;
    email: string;
    profile?: {
      firstName?: string;
      lastName?: string;
      companyName?: string;
    };
  };
}

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  status: string;
}

const AdminTrucks: React.FC = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'TENANT_ADMIN';
  
  // Fetch data
  const { data: trucksData, isLoading: trucksLoading, error: trucksError } = useQuery({ 
    queryKey: ['admin-trucks'], 
    queryFn: () => fleetApi.getTrucks() 
  });
  
  const { data: tenantsData } = useQuery({ 
    queryKey: ['admin-tenants'], 
    queryFn: fetchTenants 
  });

  const { data: usersData } = useQuery({ 
    queryKey: ['admin-all-users'], 
    queryFn: () => fetchAllUsers() 
  });

  // Form state
  const [plateNumber, setPlateNumber] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [capacityWeight, setCapacityWeight] = useState<number>(0);
  const [capacityVolume, setCapacityVolume] = useState<number>(0);
  const [status, setStatus] = useState<string>('available');
  
  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTruck, setSelectedTruck] = useState<Truck | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [sortBy, setSortBy] = useState<string>('plateNumber');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [editingTruck, setEditingTruck] = useState<Truck | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedTruckIds, setSelectedTruckIds] = useState<string[]>([]);

  // Get tenants for mapping
  const tenants: Tenant[] = tenantsData?.tenants || [];
  const tenantMap = new Map<string, string>();
  tenants.forEach((tenant) => {
    tenantMap.set(tenant.id, tenant.name);
  });

  // Get users for owner mapping
  const users: any[] = usersData || [];
  const ownerMap = new Map<string, string>();
  users.forEach((user: any) => {
    if (!user || !user.id) return;
    if (user.profile?.firstName || user.profile?.lastName) {
      ownerMap.set(user.id, `${user.profile.firstName || ''} ${user.profile.lastName || ''}`.trim() || user.profile.companyName || user.email);
    } else if (user.profile?.companyName) {
      ownerMap.set(user.id, user.profile.companyName);
    } else {
      ownerMap.set(user.id, user.email || 'Unknown');
    }
  });

  // Map trucks with tenant and owner names
  const trucks: Truck[] = useMemo(() => {
    if (!trucksData || !Array.isArray(trucksData)) return [];
    return trucksData.map((truck: any) => {
      let ownerName = 'N/A';
      if (truck.ownerId) {
        // First try to get from ownerMap
        ownerName = ownerMap.get(truck.ownerId) || 'N/A';
        
        // If not in map, try to get from truck.owner object
        if (ownerName === 'N/A' && truck.owner) {
          if (truck.owner.profile?.firstName || truck.owner.profile?.lastName) {
            ownerName = `${truck.owner.profile.firstName || ''} ${truck.owner.profile.lastName || ''}`.trim() || truck.owner.profile.companyName || truck.owner.email || 'N/A';
          } else if (truck.owner.profile?.companyName) {
            ownerName = truck.owner.profile.companyName;
          } else if (truck.owner.email) {
            ownerName = truck.owner.email;
          }
        }
      }
      
      return {
        ...truck,
        tenantId: truck.tenantId,
        tenantName: truck.tenantId ? (tenantMap.get(truck.tenantId) || 'N/A') : 'N/A',
        ownerId: truck.ownerId,
        ownerName: ownerName
      };
    });
  }, [trucksData, tenantMap, ownerMap]);

  // Mutations
  const { mutate: createTruck, isPending: isCreating } = useMutation({
    mutationFn: () => {
      if (!plateNumber.trim()) throw new Error('Plate number is required');
      if (!make.trim()) throw new Error('Make is required');
      if (!model.trim()) throw new Error('Model is required');
      if (capacityWeight <= 0) throw new Error('Capacity weight must be greater than 0');
      if (capacityVolume <= 0) throw new Error('Capacity volume must be greater than 0');
      
      return fleetApi.createTruck({
        plateNumber: plateNumber.trim(),
        make: make.trim(),
        model: model.trim(),
        year,
        capacityWeight,
        capacityVolume,
        status
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-trucks'] });
      resetForm();
      setShowCreateModal(false);
      toast.success('Truck created successfully!');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.error || 
                          error?.message || 
                          'Failed to create truck. Please try again.';
      toast.error(errorMessage);
    }
  });

  const { mutate: updateTruck, isPending: isUpdating } = useMutation({
    mutationFn: () => {
      if (!editingTruck) throw new Error('No truck to update');
      if (!editingTruck.plateNumber?.trim()) throw new Error('Plate number is required');
      if (!editingTruck.make?.trim()) throw new Error('Make is required');
      if (!editingTruck.model?.trim()) throw new Error('Model is required');
      
      return fleetApi.updateTruck(editingTruck.id, {
        plateNumber: editingTruck.plateNumber.trim(),
        make: editingTruck.make.trim(),
        model: editingTruck.model.trim(),
        year: editingTruck.year,
        capacityWeight: editingTruck.capacityWeight,
        capacityVolume: editingTruck.capacityVolume,
        status: editingTruck.status
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-trucks'] });
      setShowEditModal(false);
      setEditingTruck(null);
      toast.success('Truck updated successfully!');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.error || 
                          error?.message || 
                          'Failed to update truck. Please try again.';
      toast.error(errorMessage);
    }
  });

  const { mutate: deleteTruck } = useMutation({
    mutationFn: (truckId: string) => fleetApi.deleteTruck(truckId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-trucks'] });
      setShowDetailsModal(false);
      setSelectedTruck(null);
      toast.success('Truck deleted successfully!');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.error || 
                          error?.message || 
                          'Failed to delete truck. Please try again.';
      toast.error(errorMessage);
    }
  });

  // Status update mutation
  const { mutate: updateTruckStatus, isPending: isUpdatingStatus } = useMutation({
    mutationFn: ({ truckId, status }: { truckId: string; status: string }) => 
      fleetApi.updateTruck(truckId, { status }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['admin-trucks'] });
      toast.success(`Truck status updated to ${variables.status}`);
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.error || 
                          error?.message || 
                          'Failed to update truck status. Please try again.';
      toast.error(errorMessage);
    }
  });

  const resetForm = () => {
    setPlateNumber('');
    setMake('');
    setModel('');
    setYear(new Date().getFullYear());
    setCapacityWeight(0);
    setCapacityVolume(0);
    setStatus('available');
  };

  const handleEditTruck = (truck: Truck) => {
    setEditingTruck({ ...truck });
    setShowEditModal(true);
  };

  const handleDeleteTruck = (truckId: string) => {
    if (window.confirm('Are you sure you want to delete this truck? This action cannot be undone.')) {
      deleteTruck(truckId);
    }
  };

  const handleStatusUpdate = (truckId: string, newStatus: string) => {
    updateTruckStatus({ truckId, status: newStatus });
  };

  // Filter and sort trucks
  const filteredTrucks = trucks
    .filter((truck: Truck) => {
      const matchesSearch = truck.plateNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          truck.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          truck.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          truck.tenantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          truck.ownerName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || truck.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a: Truck, b: Truck) => {
      const aValue = a[sortBy as keyof Truck] || '';
      const bValue = b[sortBy as keyof Truck] || '';
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });

  const total = filteredTrucks.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const pagedTrucks = filteredTrucks.slice(startIdx, endIdx);

  // Calculate stats
  const stats = [
    {
      label: 'Total Trucks',
      value: trucks.length,
      description: 'All registered trucks',
      color: 'from-blue-500 to-blue-600',
      icon: FaTruck
    },
    {
      label: 'Available',
      value: trucks.filter((t: Truck) => t.status === 'available').length,
      description: 'Ready for assignment',
      color: 'from-green-500 to-green-600',
      icon: FaCheck
    },
    {
      label: 'In Use',
      value: trucks.filter((t: Truck) => t.status === 'in_use' || t.status === 'on_trip').length,
      description: 'Currently assigned',
      color: 'from-purple-500 to-purple-600',
      icon: FaPlay
    },
    {
      label: 'Maintenance',
      value: trucks.filter((t: Truck) => t.status === 'maintenance').length,
      description: 'Under maintenance',
      color: 'from-yellow-500 to-yellow-600',
      icon: FaWrench
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'in_use':
      case 'on_trip': return 'bg-blue-100 text-blue-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'unavailable': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <FaCheck className="text-green-500 text-[10px]" />;
      case 'in_use':
      case 'on_trip': return <FaPlay className="text-blue-500 text-[10px]" />;
      case 'maintenance': return <FaWrench className="text-yellow-500 text-[10px]" />;
      case 'unavailable': return <FaBan className="text-red-500 text-[10px]" />;
      default: return <FaPause className="text-gray-500 text-[10px]" />;
    }
  };

  if (trucksLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
        <span className="ml-2 text-sm text-gray-600">Loading trucks...</span>
      </div>
    );
  }

  if (trucksError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <FaExclamationTriangle className="text-red-600" />
          <h2 className="text-base font-semibold text-gray-900">Error Loading Trucks</h2>
        </div>
        <p className="text-sm text-gray-600 mt-2">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Truck Management</h1>
          <p className="text-xs text-gray-600 mt-0.5">Manage fleet trucks and assignments</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm text-xs font-medium"
          >
            <FaPlus className="w-3 h-3" />
            <span>Add Truck</span>
          </button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5 hover:shadow-md transition-all duration-200 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity" style={{
                background: stat.color === 'from-blue-500 to-blue-600' ? 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.05), transparent)' :
                           stat.color === 'from-green-500 to-green-600' ? 'linear-gradient(to bottom right, rgba(16, 185, 129, 0.05), transparent)' :
                           stat.color === 'from-purple-500 to-purple-600' ? 'linear-gradient(to bottom right, rgba(168, 85, 247, 0.05), transparent)' :
                           'linear-gradient(to bottom right, rgba(245, 158, 11, 0.05), transparent)'
              }}></div>
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-gray-600 mb-0.5">{stat.label}</p>
                    <p className="text-lg font-bold text-gray-900 mb-0.5">{stat.value}</p>
                    <p className="text-[10px] text-gray-500">{stat.description}</p>
                  </div>
                  <div className={`w-10 h-10 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon className="text-white text-sm" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-lg shadow-sm p-2.5 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="relative">
            <FaSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="Search trucks..."
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="in_use">In Use</option>
            <option value="on_trip">On Trip</option>
            <option value="maintenance">Maintenance</option>
            <option value="unavailable">Unavailable</option>
          </select>

          <button className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors">
            <FaDownload className="w-3 h-3" />
            <span>Export</span>
          </button>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <div className="text-xs text-gray-600">
            {selectedTruckIds.length > 0 ? `${selectedTruckIds.length} selected` : `${total} trucks`}
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

      {/* Trucks Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="px-2 py-1.5 w-8">
                  <input
                    type="checkbox"
                    checked={selectedTruckIds.length > 0 && selectedTruckIds.length === pagedTrucks.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTruckIds(pagedTrucks.map((t: Truck) => t.id));
                      } else {
                        setSelectedTruckIds([]);
                      }
                    }}
                  />
                </th>
                <th className="px-2 py-1.5 text-left font-semibold text-gray-900 text-xs">
                  <button 
                    className="flex items-center gap-1"
                    onClick={() => {
                      setSortBy('plateNumber');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    <span>Truck</span>
                    <FaSort className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-2 py-1.5 text-left font-semibold text-gray-900 text-xs">Make & Model</th>
                <th className="px-2 py-1.5 text-left font-semibold text-gray-900 text-xs">Capacity</th>
                <th className="px-2 py-1.5 text-left font-semibold text-gray-900 text-xs">Status</th>
                <th className="px-2 py-1.5 text-left font-semibold text-gray-900 text-xs">Tenant</th>
                <th className="px-2 py-1.5 text-left font-semibold text-gray-900 text-xs">Owner</th>
                <th className="px-2 py-1.5 text-left font-semibold text-gray-900 text-xs">Location</th>
                <th className="px-2 py-1.5 text-left font-semibold text-gray-900 text-xs">Performance</th>
                <th className="px-2 py-1.5 text-left font-semibold text-gray-900 text-xs">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pagedTrucks.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-2 py-8 text-center text-xs text-gray-500">
                    No trucks found
                  </td>
                </tr>
              ) : (
                pagedTrucks.map((truck: Truck) => (
                  <tr key={truck.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-2 py-1.5 w-8">
                      <input
                        type="checkbox"
                        checked={selectedTruckIds.includes(truck.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTruckIds([...selectedTruckIds, truck.id]);
                          } else {
                            setSelectedTruckIds(selectedTruckIds.filter(id => id !== truck.id));
                          }
                        }}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                          <FaTruck className="text-white text-xs" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 text-xs">{truck.plateNumber}</div>
                          <div className="text-[10px] text-gray-500">{truck.year}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="text-xs font-medium text-gray-900">{truck.make}</div>
                      <div className="text-[10px] text-gray-500">{truck.model}</div>
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="space-y-0.5">
                        <div className="text-xs font-medium text-gray-900">{(truck.capacityWeight || 0).toLocaleString()} kg</div>
                        <div className="text-[10px] text-gray-500">{(truck.capacityVolume || 0).toLocaleString()} m³</div>
                      </div>
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex items-center gap-1">
                        {getStatusIcon(truck.status)}
                        {isAdmin ? (
                          <select
                            className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium border-0 ${getStatusColor(truck.status)} cursor-pointer`}
                            value={truck.status}
                            onChange={(e) => handleStatusUpdate(truck.id, e.target.value)}
                            disabled={isUpdatingStatus}
                          >
                            <option value="available">Available</option>
                            <option value="in_use">In Use</option>
                            <option value="on_trip">On Trip</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="unavailable">Unavailable</option>
                          </select>
                        ) : (
                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(truck.status)}`}>
                            {truck.status.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex items-center gap-1">
                        <FaBuilding className="text-gray-400 text-xs" />
                        <span className="text-xs text-gray-900">{truck.tenantName || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex items-center gap-1">
                        <FaUser className="text-gray-400 text-xs" />
                        <span className="text-xs text-gray-900">{truck.ownerName || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex items-center gap-0.5">
                        <FaMapMarkerAlt className="text-gray-400 text-[10px]" />
                        <span className="text-[10px] text-gray-500">{truck.currentLocation || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="space-y-0.5">
                        <div className="text-xs font-medium text-gray-900">{truck.totalTrips || 0} trips</div>
                        <div className="text-[10px] text-gray-500">{Number(truck.averageRating || 0).toFixed(1)} ⭐</div>
                      </div>
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => {
                            setSelectedTruck(truck);
                            setShowDetailsModal(true);
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="View Details"
                        >
                          <FaEye className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={() => handleEditTruck(truck)}
                          className="p-1 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                          title="Edit"
                        >
                          <FaEdit className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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

      {/* Create Truck Modal */}
      {isAdmin && showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900">Create New Truck</h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="p-3 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Plate Number *
                  </label>
                  <input
                    type="text"
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="ABC-123"
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Year *
                  </label>
                  <input
                    type="number"
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="2024"
                    value={year || ''}
                    onChange={(e) => setYear(Number(e.target.value) || new Date().getFullYear())}
                    min="1900"
                    max={new Date().getFullYear() + 1}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Make *
                  </label>
                  <input
                    type="text"
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Volvo"
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Model *
                  </label>
                  <input
                    type="text"
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="FH16"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Capacity Weight (kg) *
                  </label>
                  <input
                    type="number"
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="20000"
                    value={capacityWeight || ''}
                    onChange={(e) => setCapacityWeight(Number(e.target.value) || 0)}
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Capacity Volume (m³) *
                  </label>
                  <input
                    type="number"
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1000"
                    value={capacityVolume || ''}
                    onChange={(e) => setCapacityVolume(Number(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Status
                </label>
                <select
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="available">Available</option>
                  <option value="in_use">In Use</option>
                  <option value="on_trip">On Trip</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                <div className="flex items-start gap-1.5">
                  <FaShieldAlt className="text-blue-600 mt-0.5 text-xs" />
                  <div>
                    <h4 className="font-semibold text-blue-900 text-xs">Truck Information</h4>
                    <p className="text-[10px] text-blue-700 mt-0.5">
                      Ensure all information is accurate. The truck will be available for assignment after creation.
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
                Cancel
              </button>
              <button
                onClick={() => createTruck()}
                disabled={isCreating || !plateNumber || !make || !model || !capacityWeight || !capacityVolume}
                className="px-2.5 py-1.5 text-xs bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 font-medium"
              >
                {isCreating && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                <span>{isCreating ? 'Creating...' : 'Create Truck'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Truck Modal */}
      {showEditModal && editingTruck && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900">Edit Truck</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingTruck(null);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="p-3 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Plate Number *
                  </label>
                  <input
                    type="text"
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="ABC-123"
                    value={editingTruck.plateNumber || ''}
                    onChange={(e) => setEditingTruck({ ...editingTruck, plateNumber: e.target.value.toUpperCase() })}
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Year *
                  </label>
                  <input
                    type="number"
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="2024"
                    value={editingTruck.year || ''}
                    onChange={(e) => setEditingTruck({ ...editingTruck, year: Number(e.target.value) || new Date().getFullYear() })}
                    min="1900"
                    max={new Date().getFullYear() + 1}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Make *
                  </label>
                  <input
                    type="text"
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Volvo"
                    value={editingTruck.make || ''}
                    onChange={(e) => setEditingTruck({ ...editingTruck, make: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Model *
                  </label>
                  <input
                    type="text"
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="FH16"
                    value={editingTruck.model || ''}
                    onChange={(e) => setEditingTruck({ ...editingTruck, model: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Capacity Weight (kg) *
                  </label>
                  <input
                    type="number"
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="20000"
                    value={editingTruck.capacityWeight || ''}
                    onChange={(e) => setEditingTruck({ ...editingTruck, capacityWeight: Number(e.target.value) || 0 })}
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Capacity Volume (m³) *
                  </label>
                  <input
                    type="number"
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1000"
                    value={editingTruck.capacityVolume || ''}
                    onChange={(e) => setEditingTruck({ ...editingTruck, capacityVolume: Number(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Status
                </label>
                <select
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={editingTruck.status || 'available'}
                  onChange={(e) => setEditingTruck({ ...editingTruck, status: e.target.value })}
                >
                  <option value="available">Available</option>
                  <option value="in_use">In Use</option>
                  <option value="on_trip">On Trip</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>
            </div>

            <div className="p-2.5 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingTruck(null);
                }}
                className="px-2.5 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => updateTruck()}
                disabled={isUpdating || !editingTruck.plateNumber || !editingTruck.make || !editingTruck.model}
                className="px-2.5 py-1.5 text-xs bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 font-medium"
              >
                {isUpdating && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                <span>{isUpdating ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Truck Details Modal */}
      {showDetailsModal && selectedTruck && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <FaTruck className="text-white text-sm" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{selectedTruck.plateNumber}</h2>
                    <p className="text-xs text-gray-600">{selectedTruck.make} {selectedTruck.model} ({selectedTruck.year})</p>
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
              {/* Status */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(selectedTruck.status)}
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(selectedTruck.status)}`}>
                    {selectedTruck.status.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </span>
                </div>
                <div className="flex space-x-1.5">
                  <button 
                    onClick={() => {
                      handleEditTruck(selectedTruck);
                      setShowDetailsModal(false);
                    }}
                    className="px-2.5 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Edit Truck
                  </button>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
                  <div className="flex items-center space-x-2">
                    <FaRoad className="text-blue-600 text-xs" />
                    <div>
                      <div className="text-base font-bold text-blue-900">{(selectedTruck.capacityWeight || 0).toLocaleString()}</div>
                      <div className="text-[10px] text-blue-700">Weight (kg)</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-2 border border-green-200">
                  <div className="flex items-center space-x-2">
                    <FaTruck className="text-green-600 text-xs" />
                    <div>
                      <div className="text-base font-bold text-green-900">{(selectedTruck.capacityVolume || 0).toLocaleString()}</div>
                      <div className="text-[10px] text-green-700">Volume (m³)</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-2 border border-purple-200">
                  <div className="flex items-center space-x-2">
                    <FaCheck className="text-purple-600 text-xs" />
                    <div>
                      <div className="text-base font-bold text-purple-900">{selectedTruck.totalTrips || 0}</div>
                      <div className="text-[10px] text-purple-700">Total Trips</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-yellow-50 rounded-lg p-2 border border-yellow-200">
                  <div className="flex items-center space-x-2">
                    <FaClock className="text-yellow-600 text-xs" />
                    <div>
                      <div className="text-base font-bold text-yellow-900">{Number(selectedTruck.averageRating || 0).toFixed(1)}</div>
                      <div className="text-[10px] text-yellow-700">Rating</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Truck Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-gray-900">Truck Information</h3>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Plate Number:</span>
                      <span className="font-medium">{selectedTruck.plateNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Make & Model:</span>
                      <span className="font-medium">{selectedTruck.make} {selectedTruck.model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Year:</span>
                      <span className="font-medium">{selectedTruck.year}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Location:</span>
                      <span className="font-medium">{selectedTruck.currentLocation || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mileage:</span>
                      <span className="font-medium">{(selectedTruck.mileage || 0).toLocaleString()} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tenant:</span>
                      <span className="font-medium">{selectedTruck.tenantName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Owner:</span>
                      <span className="font-medium">{selectedTruck.ownerName || 'N/A'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-gray-900">Performance</h3>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Trips:</span>
                      <span className="font-medium">{selectedTruck.totalTrips || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Revenue:</span>
                      <span className="font-medium">RWF {(selectedTruck.totalRevenue || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Average Rating:</span>
                      <span className="font-medium">{Number(selectedTruck.averageRating || 0).toFixed(1)} ⭐</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fuel Efficiency:</span>
                      <span className="font-medium">{selectedTruck.fuelEfficiency ? `${selectedTruck.fuelEfficiency} km/L` : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium">{new Date(selectedTruck.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assigned Drivers */}
              {selectedTruck.assignedDrivers && selectedTruck.assignedDrivers.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-gray-900">Assigned Drivers</h3>
                  <div className="space-y-1.5">
                    {selectedTruck.assignedDrivers.map((driver: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-xs">
                        <div className="flex items-center gap-2">
                          <FaUser className="text-gray-400 w-3 h-3" />
                          <span className="font-medium">{driver.driverName || 'Unknown'}</span>
                        </div>
                        <span className="text-gray-500">{new Date(driver.assignmentDate).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTrucks;
