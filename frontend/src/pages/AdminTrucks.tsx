import React, { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { fleetApi, type FleetItem } from '../services/fleetApi';
import { fetchTenants, fetchAllUsers } from '../services/adminApi';
import api from '../services/api';
import AdminPageLayout from '../components/Admin/AdminPageLayout';
import { useAuth } from '../contexts/AuthContext';
import { usePermission } from '../contexts/PermissionContext';
import {
  Truck as LucideTruck, Edit, Plus, Search, Download,
  Eye, Check, X, Ban, MapPin,
  ChevronsUpDown, Clock, User, Building2,
  ShieldCheck, AlertTriangle, Play, Pause,
  Trash2, Wrench, Layers, Milestone
} from 'lucide-react';

interface Truck extends FleetItem {
  tenantId?: string;
  tenantName?: string;
  ownerId?: string;
  ownerName?: string;
  currentLocationString?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  locationUpdatedAt?: string;
  tenant?: {
    id: string;
    name: string;
    subdomain?: string;
    status?: string;
    type?: string;
  };
  owner?: {
    id: string;
    email: string;
    phoneNumber?: string;
    profile?: {
      firstName?: string;
      lastName?: string;
      companyName?: string;
    };
  };
  ownerEmail?: string | null;
  ownerPhone?: string | null;
  currentDriverName?: string | null;
  currentDriverPhone?: string | null;
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
  const { hasPermission } = usePermission();

  // Check permissions instead of hardcoded role
  const canManageTrucks = hasPermission('truck:manage') || hasPermission('truck:update') || user?.role === 'ADMIN' || user?.role === 'TENANT_ADMIN';

  // Fetch data
  const { data: trucksData, isLoading: trucksLoading, error: trucksError } = useQuery({
    queryKey: ['admin-trucks'],
    queryFn: async () => {
      console.log('🚛 Fetching trucks from admin endpoint...');
      // Use admin endpoint for admin users
      const response = await api.get('/admin/all/trucks');
      console.log('🚛 Admin trucks response:', response);
      console.log('🚛 Response data:', response.data);
      console.log('🚛 Trucks array:', response.data?.trucks || response.data);
      const trucks = response.data?.trucks || response.data || [];
      console.log('🚛 Final trucks count:', Array.isArray(trucks) ? trucks.length : 'Not an array');
      return trucks;
    }
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
  const [tenantFilter, setTenantFilter] = useState<string>('all');
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
  const [groupByOwner, setGroupByOwner] = useState(false);

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
    console.log('🔄 Mapping trucks data...');
    console.log('🔄 trucksData:', trucksData);
    console.log('🔄 Is array?', Array.isArray(trucksData));
    if (!trucksData || !Array.isArray(trucksData)) {
      console.log('⚠️ No trucks data or not an array');
      return [];
    }
    console.log('🔄 Mapping', trucksData.length, 'trucks');
    const mapped = trucksData.map((truck: any) => {
      // Backend now provides ownerName, tenantName, and full objects
      // Use backend data if available, otherwise fall back to local mapping
      let ownerName = truck.ownerName || 'No Owner';
      let tenantName = truck.tenantName || 'Unknown Tenant';

      // Fallback to local mapping if backend didn't provide names
      if (ownerName === 'No Owner' && truck.ownerId) {
        ownerName = ownerMap.get(truck.ownerId) || 'N/A';
      }

      if (tenantName === 'Unknown Tenant' && truck.tenantId) {
        tenantName = tenantMap.get(truck.tenantId) || 'N/A';
      }

      return {
        ...truck,
        tenantName,
        ownerName,
        // Include additional info from backend
        ownerEmail: truck.ownerEmail || truck.owner?.email || null,
        ownerPhone: truck.ownerPhone || truck.owner?.phoneNumber || null,
        tenantStatus: truck.tenant?.status || null,
        tenantType: truck.tenant?.type || null,
        currentDriverName: truck.currentDriverName || null,
        currentDriverPhone: truck.currentDriverPhone || truck.driver?.phoneNumber || null,
      };
    });
    console.log('✅ Mapped trucks:', mapped.length);
    return mapped;
  }, [trucksData, tenantMap, ownerMap]);

  // Get only tenants that have trucks with counts
  const tenantsWithTrucks = useMemo(() => {
    const tenantTruckCounts = new Map<string, number>();
    trucks.forEach(truck => {
      if (truck.tenantId) {
        tenantTruckCounts.set(truck.tenantId, (tenantTruckCounts.get(truck.tenantId) || 0) + 1);
      }
    });

    return tenants
      .filter(tenant => tenantTruckCounts.has(tenant.id))
      .map(tenant => ({
        ...tenant,
        truckCount: tenantTruckCounts.get(tenant.id) || 0
      }))
      .sort((a, b) => b.truckCount - a.truckCount); // Sort by truck count descending
  }, [trucks, tenants]);

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
      const matchesTenant = tenantFilter === 'all' || truck.tenantId === tenantFilter;
      return matchesSearch && matchesStatus && matchesTenant;
    })
    .sort((a: Truck, b: Truck) => {
      const aValue = a[sortBy as keyof Truck] || '';
      const bValue = b[sortBy as keyof Truck] || '';
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });

  // Group trucks by owner if enabled
  const groupedTrucks = useMemo(() => {
    if (!groupByOwner) return null;

    const groups = new Map<string, Truck[]>();
    filteredTrucks.forEach((truck: Truck) => {
      const ownerKey = truck.ownerId || 'unassigned';
      if (!groups.has(ownerKey)) {
        groups.set(ownerKey, []);
      }
      groups.get(ownerKey)!.push(truck);
    });

    return Array.from(groups.entries()).map(([ownerId, trucks]) => ({
      ownerId,
      ownerName: trucks[0]?.ownerName || 'Unassigned',
      tenantName: trucks[0]?.tenantName || 'N/A',
      trucks: trucks.sort((a, b) => (a.plateNumber || '').localeCompare(b.plateNumber || '')),
      totalTrucks: trucks.length,
      availableTrucks: trucks.filter(t => t.status === 'available').length,
      inUseTrucks: trucks.filter(t => t.status === 'in_use' || t.status === 'on_trip').length,
      maintenanceTrucks: trucks.filter(t => t.status === 'maintenance').length
    })).sort((a, b) => b.totalTrucks - a.totalTrucks);
  }, [filteredTrucks, groupByOwner]);

  const total = filteredTrucks.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const pagedTrucks = groupByOwner ? filteredTrucks : filteredTrucks.slice(startIdx, endIdx);

  // Calculate stats (use filtered trucks for accurate counts)
  const stats = [
    {
      label: 'Total Trucks',
      value: filteredTrucks.length,
      description: tenantFilter !== 'all' ? 'In selected tenant' : 'All registered trucks',
      color: 'bg-gray-800',
      icon: LucideTruck
    },
    {
      label: 'Available',
      value: filteredTrucks.filter((t: Truck) => t.status === 'available').length,
      description: 'Ready for assignment',
      color: 'bg-gray-800',
      icon: Check
    },
    {
      label: 'In Use',
      value: filteredTrucks.filter((t: Truck) => t.status === 'in_use' || t.status === 'on_trip').length,
      description: 'Currently assigned',
      color: 'bg-gray-800',
      icon: Play
    },
    {
      label: 'Maintenance',
      value: filteredTrucks.filter((t: Truck) => t.status === 'maintenance').length,
      description: 'Under maintenance',
      color: 'bg-gray-800',
      icon: Wrench
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
      case 'available': return <Check className="text-green-500" size={12} />;
      case 'in_use':
      case 'on_trip': return <Play className="text-indigo-500" size={12} />;
      case 'maintenance': return <Wrench className="text-yellow-500" size={12} />;
      case 'unavailable': return <Ban className="text-red-500" size={12} />;
      default: return <Pause className="text-gray-500" size={12} />;
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
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="text-red-600" size={24} />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Error Loading Trucks</h2>
        <p className="text-sm text-gray-600 mb-4">Failed to load truck data. Please try again later.</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <AdminPageLayout
      title="Truck Management"
      description="Manage fleet trucks and assignments"
      actions={
        canManageTrucks ? (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-all duration-200 text-sm font-bold"
          >
            <Plus size={16} />
            <span>Add Truck</span>
          </button>
        ) : undefined
      }
    >

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-300 transition-all duration-200 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity bg-gray-50"></div>
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-gray-600 mb-1">{stat.label}</p>
                    <p className="text-2xl font-black text-gray-900 mb-0.5">{stat.value}</p>
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

      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search trucks..."
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
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="in_use">In Use</option>
            <option value="on_trip">On Trip</option>
            <option value="maintenance">Maintenance</option>
            <option value="unavailable">Unavailable</option>
          </select>

          <select
            className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={tenantFilter}
            onChange={(e) => setTenantFilter(e.target.value)}
          >
            <option value="all">All Tenants ({tenantsWithTrucks.length})</option>
            {tenantsWithTrucks.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name} ({tenant.truckCount} {tenant.truckCount === 1 ? 'truck' : 'trucks'})
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              setGroupByOwner(!groupByOwner);
            }}
            className={`px-3 py-2 text-xs border rounded-lg flex items-center justify-center gap-2 transition-all ${groupByOwner
              ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold'
              : 'border-gray-200 hover:bg-gray-50 text-gray-600'
              }`}
          >
            <Layers size={14} />
            <span>Group by Owner</span>
          </button>

          <button className="px-3 py-2 text-xs border border-gray-200 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors text-gray-600">
            <Download size={14} />
            <span>Export</span>
          </button>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <div className="text-xs text-gray-600">
            {selectedTruckIds.length > 0 ? `${selectedTruckIds.length} selected` : `${total} trucks`}
            {groupByOwner && groupedTrucks && ` • ${groupedTrucks.length} owners`}
          </div>
          <div className="flex items-center gap-1.5">
            {!groupByOwner && (
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
            )}
          </div>
        </div>
      </div>

      {/* Trucks Table */}
      <div className="bg-white rounded-xl overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 w-12">
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
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    className="flex items-center gap-1 font-semibold text-gray-900 text-xs"
                    onClick={() => {
                      setSortBy('plateNumber');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    <span>Truck Details</span>
                    <ChevronsUpDown size={14} />
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Specifications
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Organization
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pagedTrucks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <LucideTruck className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-sm font-medium text-gray-900 mb-1">No trucks found</h3>
                      <p className="text-xs text-gray-500">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                pagedTrucks.map((truck: Truck) => (
                  <tr key={truck.id} className="hover:bg-gray-50 transition-colors group border-b border-gray-100 last:border-0">
                    <td className="px-4 py-4 w-12">
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
                        className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-2 focus:ring-indigo-500"
                      />
                    </td>

                    {/* Truck Details */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100">
                          <LucideTruck className="text-indigo-600" size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-bold text-gray-900 truncate">{truck.plateNumber}</p>
                            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded">
                              {truck.year}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-500 truncate capitalize">
                            {truck.make} {truck.model}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Specifications */}
                    <td className="px-4 py-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          <span className="text-xs text-gray-900 font-medium">
                            {(truck.capacityWeight || 0).toLocaleString()} kg
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                          <span className="text-xs text-gray-600">
                            {(truck.capacityVolume || 0).toLocaleString()} m³
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${truck.status === 'available' ? 'bg-green-500 animate-pulse' :
                          truck.status === 'in_use' || truck.status === 'on_trip' ? 'bg-blue-500' :
                            truck.status === 'maintenance' ? 'bg-yellow-500' :
                              'bg-red-500'
                          }`}></div>
                        {canManageTrucks ? (
                          <select
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border-0 ${getStatusColor(truck.status)} cursor-pointer hover:shadow-md transition-shadow`}
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
                          <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${getStatusColor(truck.status)}`}>
                            {truck.status.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Organization */}
                    <td className="px-4 py-4">
                      <div className="space-y-2">
                        {/* Tenant Info */}
                        <div className="flex items-center gap-2 group/tenant relative">
                          <div className="w-6 h-6 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Building2 className="text-indigo-600" size={12} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[11px] text-gray-900 font-bold truncate block">
                              {truck.tenantName || 'N/A'}
                            </span>
                            {truck.tenant?.subdomain && (
                              <span className="text-[10px] text-gray-500 truncate block">
                                {truck.tenant.subdomain}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Owner Info */}
                        <div className="flex items-center gap-2 group/owner relative">
                          <div className="w-6 h-6 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <User className="text-gray-600" size={12} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[11px] text-gray-900 font-bold truncate block">
                              {truck.ownerName || 'No Owner'}
                            </span>
                            {truck.ownerEmail && (
                              <span className="text-[10px] text-gray-500 truncate block">
                                {truck.ownerEmail}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Current Driver Info (if assigned) */}
                        {truck.currentDriverName && (
                          <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                            <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <User className="text-green-600" size={12} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-[10px] text-gray-500 block">Driver:</span>
                              <span className="text-xs text-gray-900 font-medium truncate block">
                                {truck.currentDriverName}
                              </span>
                              {truck.currentDriverPhone && (
                                <span className="text-[10px] text-gray-500 truncate block">
                                  {truck.currentDriverPhone}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Performance */}
                    <td className="px-4 py-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-gray-600">Trips:</span>
                          <span className="text-xs font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                            {truck.totalTrips || 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-gray-600">Rating:</span>
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-yellow-600">
                              {Number(truck.averageRating || 0).toFixed(1)}
                            </span>
                            <span className="text-yellow-500">⭐</span>
                          </div>
                        </div>
                        {truck.currentLocationString && (
                          <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-1">
                            <MapPin className="text-red-500" size={10} />
                            <span className="truncate max-w-[120px]" title={truck.currentLocationString}>
                              {truck.currentLocationString}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedTruck(truck);
                            setShowDetailsModal(true);
                          }}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                        {truck.coordinates && (
                          <button
                            onClick={() => {
                              const { latitude, longitude } = truck.coordinates!;
                              window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, '_blank');
                            }}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="View Location on Map"
                          >
                            <MapPin size={14} />
                          </button>
                        )}
                        {canManageTrucks && (
                          <>
                            <button
                              onClick={() => handleEditTruck(truck)}
                              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteTruck(truck.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Enhanced Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">
              Showing <span className="font-semibold text-gray-900">{startIdx + 1}</span> to{' '}
              <span className="font-semibold text-gray-900">{Math.min(endIdx, total)}</span> of{' '}
              <span className="font-semibold text-gray-900">{total}</span> trucks
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white hover:shadow-sm transition-all"
              onClick={() => setPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={i}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 text-xs font-medium rounded-lg transition-all ${currentPage === pageNum
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white hover:shadow-sm transition-all"
              onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Create Truck Modal */}
      {canManageTrucks && showCreateModal && (
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
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                >
                  <X size={18} />
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

              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="text-indigo-600 mt-0.5" size={16} />
                  <div>
                    <h4 className="font-semibold text-indigo-900 text-xs">Truck Information</h4>
                    <p className="text-[10px] text-indigo-700 mt-0.5">
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
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                >
                  <X size={18} />
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
                  <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100">
                    <LucideTruck className="text-indigo-600" size={18} />
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
                  <X size={18} />
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
                <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-100">
                  <div className="flex items-center space-x-2">
                    <Milestone className="text-indigo-600" size={16} />
                    <div>
                      <div className="text-sm font-black text-indigo-900">{(selectedTruck.capacityWeight || 0).toLocaleString()}</div>
                      <div className="text-[10px] text-indigo-700">Weight (kg)</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="flex items-center space-x-2">
                    <LucideTruck className="text-gray-600" size={16} />
                    <div>
                      <div className="text-sm font-black text-gray-900">{(selectedTruck.capacityVolume || 0).toLocaleString()}</div>
                      <div className="text-[10px] text-gray-500">Volume (m³)</div>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                  <div className="flex items-center space-x-2">
                    <Check className="text-green-600" size={16} />
                    <div>
                      <div className="text-sm font-black text-green-900">{selectedTruck.totalTrips || 0}</div>
                      <div className="text-[10px] text-green-700">Total Trips</div>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-100">
                  <div className="flex items-center space-x-2">
                    <Clock className="text-yellow-600" size={16} />
                    <div>
                      <div className="text-sm font-black text-yellow-900">{Number(selectedTruck.averageRating || 0).toFixed(1)}</div>
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
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{selectedTruck.currentLocationString || 'N/A'}</span>
                        {selectedTruck.coordinates && (
                          <button
                            onClick={() => {
                              const { latitude, longitude } = selectedTruck.coordinates!;
                              window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, '_blank');
                            }}
                            className="text-blue-600 hover:text-blue-700 text-xs underline"
                            title="View on Google Maps"
                          >
                            View Map
                          </button>
                        )}
                      </div>
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
                          <User className="text-gray-400" size={12} />
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
    </AdminPageLayout>
  );
};

export default AdminTrucks;
