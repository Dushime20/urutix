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
  AlertTriangle, Play, Pause,
  Trash2, Wrench, Layers, Milestone
} from 'lucide-react';
import { TranslatedText } from '../components/translated-text';

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
      label: <TranslatedText text="Total Trucks" />,
      value: filteredTrucks.length,
      description: tenantFilter !== 'all' ? <TranslatedText text="In selected tenant" /> : <TranslatedText text="All registered trucks" />,
      color: 'bg-gray-800',
      icon: LucideTruck
    },
    {
      label: <TranslatedText text="Available" />,
      value: filteredTrucks.filter((t: Truck) => t.status === 'available').length,
      description: <TranslatedText text="Ready for assignment" />,
      color: 'bg-gray-800',
      icon: Check
    },
    {
      label: <TranslatedText text="In Use" />,
      value: filteredTrucks.filter((t: Truck) => t.status === 'in_use' || t.status === 'on_trip').length,
      description: <TranslatedText text="Currently assigned" />,
      color: 'bg-gray-800',
      icon: Play
    },
    {
      label: <TranslatedText text="Maintenance" />,
      value: filteredTrucks.filter((t: Truck) => t.status === 'maintenance').length,
      description: <TranslatedText text="Under maintenance" />,
      color: 'bg-gray-800',
      icon: Wrench
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'in_use':
      case 'on_trip': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'maintenance': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'unavailable': return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <Check className="w-3 h-3" />;
      case 'in_use':
      case 'on_trip': return <Play className="w-3 h-3" />;
      case 'maintenance': return <Wrench className="w-3 h-3" />;
      case 'unavailable': return <Ban className="w-3 h-3" />;
      default: return <Pause className="w-3 h-3" />;
    }
  };

  if (trucksLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
        <span className="ml-2 text-sm text-gray-600"><TranslatedText text="Loading trucks..." /></span>
      </div>
    );
  }

  if (trucksError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="text-red-600" size={24} />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2"><TranslatedText text="Error Loading Trucks" /></h2>
        <p className="text-sm text-gray-600 mb-4"><TranslatedText text="Failed to load truck data. Please try again later." /></p>
        <button
          onClick={() => window.location.reload()}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          <TranslatedText text="Retry" />
        </button>
      </div>
    );
  }

  return (
    <AdminPageLayout
      title={<TranslatedText text="Truck Management" />}
      description={<TranslatedText text="Manage fleet trucks and assignments" />}
      actions={
        canManageTrucks ? (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-all duration-200 text-sm font-bold"
          >
            <Plus size={16} />
            <span><TranslatedText text="Add Truck" /></span>
          </button>
        ) : undefined
      }
    >

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-500">
                <Icon size={80} className="text-gray-900" />
              </div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all duration-300 shadow-sm">
                    <Icon size={18} />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{stat.label}</p>
                </div>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-black text-gray-900 leading-none tracking-tight">
                    {stat.value}
                  </h3>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4 leading-none">{stat.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
          <div className="relative group">
            <input
              type="text"
              placeholder="SEARCH TRUCKS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 text-[10px] font-black uppercase tracking-widest border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-full bg-[#fafafa] transition-all shadow-sm"
            />
            <Search className="absolute left-3.5 top-3 text-slate-400 group-hover:text-indigo-500 transition-colors w-3.5 h-3.5" />
          </div>

          <select
            className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white shadow-sm cursor-pointer hover:border-indigo-200 transition-all"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all"><TranslatedText text="ALL STATUS" /></option>
            <option value="available"><TranslatedText text="AVAILABLE" /></option>
            <option value="in_use"><TranslatedText text="IN USE" /></option>
            <option value="on_trip"><TranslatedText text="ON TRIP" /></option>
            <option value="maintenance"><TranslatedText text="MAINTENANCE" /></option>
            <option value="unavailable"><TranslatedText text="UNAVAILABLE" /></option>
          </select>

          <select
            className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white shadow-sm cursor-pointer hover:border-indigo-200 transition-all"
            value={tenantFilter}
            onChange={(e) => setTenantFilter(e.target.value)}
          >
            <option value="all"><TranslatedText text="ALL TENANTS" /> ({tenantsWithTrucks.length})</option>
            {tenantsWithTrucks.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name.toUpperCase()} ({tenant.truckCount})
              </option>
            ))}
          </select>

          <button
            onClick={() => setGroupByOwner(!groupByOwner)}
            className={`px-4 py-2.5 text-[10px] font-black uppercase tracking-widest border rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm ${groupByOwner
              ? 'bg-indigo-600 border-indigo-600 text-white'
              : 'border-gray-200 hover:border-indigo-200 text-slate-600 bg-white hover:text-indigo-600'
              }`}
          >
            <Layers size={14} />
            <span>{groupByOwner ? <TranslatedText text="UNGROUP" /> : <TranslatedText text="GROUP BY OWNER" />}</span>
          </button>

          <button className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest border border-gray-200 rounded-xl flex items-center justify-center gap-2 hover:border-indigo-200 text-slate-600 bg-white hover:text-indigo-600 transition-all shadow-sm">
            <Download size={14} />
            <span><TranslatedText text="EXPORT" /></span>
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-4">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-slate-300" />
            {selectedTruckIds.length > 0 ? `${selectedTruckIds.length} SELECTED` : `${total} TRUCKS IDENTIFIED`}
            {groupByOwner && groupedTrucks && ` • ${groupedTrucks.length} OWNERS`}
          </div>
          <div className="flex items-center gap-3">
            {!groupByOwner && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">VIEW:</span>
                <select
                  className="px-3 py-1.5 text-[10px] font-black border border-gray-200 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                >
                  <option value={10}>10 PER PAGE</option>
                  <option value={25}>25 PER PAGE</option>
                  <option value={50}>50 PER PAGE</option>
                  <option value={100}>100 PER PAGE</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trucks Table */}
      <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#fafafa] border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 w-12">
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
                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </th>
                <th className="px-6 py-4 text-left">
                  <button
                    className="flex items-center gap-1.5"
                    onClick={() => {
                      setSortBy('plateNumber');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest"><TranslatedText text="Truck Identity" /></span>
                    <ChevronsUpDown size={12} className="text-slate-300" />
                  </button>
                </th>
                <th className="px-6 py-4 text-left">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest"><TranslatedText text="Specifications" /></span>
                </th>
                <th className="px-6 py-4 text-left">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest"><TranslatedText text="Status" /></span>
                </th>
                <th className="px-6 py-4 text-left">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest"><TranslatedText text="Organization" /></span>
                </th>
                <th className="px-6 py-4 text-left">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest"><TranslatedText text="Performance" /></span>
                </th>
                <th className="px-6 py-4 text-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest"><TranslatedText text="Action" /></span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {pagedTrucks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <LucideTruck className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-sm font-medium text-gray-900 mb-1"><TranslatedText text="No trucks found" /></h3>
                      <p className="text-xs text-gray-500"><TranslatedText text="Try adjusting your search or filters" /></p>
                    </div>
                  </td>
                </tr>
              ) : (
                pagedTrucks.map((truck: Truck) => (
                  <tr key={truck.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-5 w-12">
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
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-indigo-100 bg-indigo-50 text-indigo-600 shadow-sm group-hover:scale-105 transition-transform">
                          <LucideTruck size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-black text-gray-900 tracking-tight leading-tight uppercase">{truck.plateNumber}</p>
                            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 leading-none">
                              {truck.year}
                            </span>
                          </div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                            {truck.make} {truck.model}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Specifications */}
                    <td className="px-6 py-5">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
                          <span className="text-[10px] font-black text-gray-900 uppercase tracking-tight">
                            {(truck.capacityWeight || 0).toLocaleString()} KG
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.5)]"></div>
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
                            {(truck.capacityVolume || 0).toLocaleString()} M³
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        {canManageTrucks ? (
                          <select
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-[9px] font-black uppercase tracking-widest ${getStatusColor(truck.status)} shadow-sm cursor-pointer hover:shadow-md transition-all appearance-none pr-8 relative`}
                            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'currentColor\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'currentColor\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1rem' }}
                            value={truck.status}
                            onChange={(e) => handleStatusUpdate(truck.id, e.target.value)}
                            disabled={isUpdatingStatus}
                          >
                            <option value="available"><TranslatedText text="AVAILABLE" /></option>
                            <option value="in_use"><TranslatedText text="IN USE" /></option>
                            <option value="on_trip"><TranslatedText text="ON TRIP" /></option>
                            <option value="maintenance"><TranslatedText text="MAINTENANCE" /></option>
                            <option value="unavailable"><TranslatedText text="UNAVAILABLE" /></option>
                          </select>
                        ) : (
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[9px] font-black uppercase tracking-widest ${getStatusColor(truck.status)} shadow-sm`}>
                            {getStatusIcon(truck.status)}
                            {truck.status.replace('_', ' ')}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Organization */}
                    <td className="px-6 py-5">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
                            <Building2 size={12} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-gray-900 uppercase tracking-tight leading-none">{truck.tenantName || 'N/A'}</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 leading-none"><TranslatedText text="TENANT LOG" /></p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-slate-400 shadow-sm">
                            <User size={12} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-gray-700 uppercase tracking-tight leading-none">{truck.ownerName || <TranslatedText text="NO OWNER" />}</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 leading-none"><TranslatedText text="CAPITAL OWNER" /></p>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Performance */}
                    <td className="px-6 py-5">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-4 p-2 bg-slate-50 rounded-lg border border-slate-100">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest"><TranslatedText text="FISCAL TRIPS" /></span>
                          <span className="text-[10px] font-black text-slate-900">{truck.totalTrips || 0}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 p-2 bg-emerald-50 rounded-lg border border-emerald-100">
                          <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest"><TranslatedText text="YIELD RATING" /></span>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-black text-emerald-700">
                              {Number(truck.averageRating || 0).toFixed(1)}
                            </span>
                            <span className="text-emerald-500">★</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-5">
                      <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setSelectedTruck(truck);
                            setShowDetailsModal(true);
                          }}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all shadow-sm bg-white border border-gray-100"
                          title={<TranslatedText text="View Details" />}
                        >
                          <Eye size={14} />
                        </button>
                        {truck.coordinates && (
                          <button
                            onClick={() => {
                              const { latitude, longitude } = truck.coordinates!;
                              window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, '_blank');
                            }}
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all shadow-sm bg-white border border-gray-100"
                            title={<TranslatedText text="View Location on Map" />}
                          >
                            <MapPin size={14} />
                          </button>
                        )}
                        {canManageTrucks && (
                          <>
                            <button
                              onClick={() => handleEditTruck(truck)}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all shadow-sm bg-white border border-gray-100"
                              title={<TranslatedText text="Edit" />}
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteTruck(truck.id)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all shadow-sm bg-white border border-gray-100"
                              title={<TranslatedText text="Delete" />}
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
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-50 bg-[#fafafa]">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <TranslatedText text="IDENTIFIED" /> <span className="text-gray-900">{startIdx + 1}</span> -{' '}
              <span className="text-gray-900">{Math.min(endIdx, total)}</span> <TranslatedText text="OF" />{' '}
              <span className="text-gray-900">{total}</span> <TranslatedText text="TRUCK ENTITIES" />
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-4 py-2 text-[10px] font-black uppercase tracking-widest border border-gray-200 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed bg-white hover:bg-gray-50 hover:border-indigo-200 text-slate-600 transition-all shadow-sm"
              onClick={() => setPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <TranslatedText text="PREV" />
            </button>
            <div className="flex items-center gap-1.5">
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
                    className={`w-9 h-9 text-[10px] font-black rounded-xl transition-all border ${currentPage === pageNum
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                      : 'bg-white border-gray-200 text-slate-600 hover:bg-gray-50 hover:border-indigo-200'
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              className="px-4 py-2 text-[10px] font-black uppercase tracking-widest border border-gray-200 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed bg-white hover:bg-gray-50 hover:border-indigo-200 text-slate-600 transition-all shadow-sm"
              onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              <TranslatedText text="NEXT" />
            </button>
          </div>
        </div>
      </div>

      {/* Create Truck Modal */}
      {canManageTrucks && showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-white/20 animate-in fade-in zoom-in duration-300">
            <div className="bg-slate-900 px-8 py-6 flex items-center justify-between">
              <div>
                <h2 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1"><TranslatedText text="Fleet Expansion" /></h2>
                <h3 className="text-xl font-black text-white uppercase tracking-tight"><TranslatedText text="Register New Asset" /></h3>
              </div>
              <button
                onClick={() => { setShowCreateModal(false); resetForm(); }}
                className="w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-xl flex items-center justify-center transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-8 bg-[#fafafa]">
              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                    <TranslatedText text="Identity & Manufacturing" />
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1"><TranslatedText text="Plate Number" /></label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 text-[10px] font-black uppercase tracking-widest bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                        placeholder="ABC-0000"
                        value={plateNumber}
                        onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1"><TranslatedText text="Manufacturing Year" /></label>
                      <input
                        type="number"
                        className="w-full px-4 py-3 text-[10px] font-black uppercase tracking-widest bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                        placeholder="2024"
                        value={year || ''}
                        onChange={(e) => setYear(Number(e.target.value) || new Date().getFullYear())}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1"><TranslatedText text="Manufacturer (Make)" /></label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 text-[10px] font-black uppercase tracking-widest bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                        placeholder="VOLVO"
                        value={make}
                        onChange={(e) => setMake(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1"><TranslatedText text="Model Specification" /></label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 text-[10px] font-black uppercase tracking-widest bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                        placeholder="FH-16"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                    <TranslatedText text="Technical Capacity" />
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1"><TranslatedText text="Weight Capacity (KG)" /></label>
                      <div className="relative">
                        <input
                          type="number"
                          className="w-full pl-4 pr-12 py-3 text-[10px] font-black uppercase tracking-widest bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                          placeholder="20000"
                          value={capacityWeight || ''}
                          onChange={(e) => setCapacityWeight(Number(e.target.value) || 0)}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">KG</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1"><TranslatedText text="Volume Capacity (M³)" /></label>
                      <div className="relative">
                        <input
                          type="number"
                          className="w-full pl-4 pr-12 py-3 text-[10px] font-black uppercase tracking-widest bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                          placeholder="100"
                          value={capacityVolume || ''}
                          onChange={(e) => setCapacityVolume(Number(e.target.value) || 0)}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">M³</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                    <TranslatedText text="Asset Status" />
                  </h4>
                  <select
                    className="w-full px-4 py-3 text-[10px] font-black uppercase tracking-widest bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm cursor-pointer"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="available"><TranslatedText text="AVAILABLE" /></option>
                    <option value="in_use"><TranslatedText text="IN USE" /></option>
                    <option value="on_trip"><TranslatedText text="ON TRIP" /></option>
                    <option value="maintenance"><TranslatedText text="MAINTENANCE" /></option>
                    <option value="unavailable"><TranslatedText text="UNAVAILABLE" /></option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => { setShowCreateModal(false); resetForm(); }}
                  className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <TranslatedText text="Discard" />
                </button>
                <button
                  onClick={() => createTruck()}
                  disabled={isCreating || !plateNumber || !make || !model || !capacityWeight || !capacityVolume}
                  className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg hover:shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isCreating ? <TranslatedText text="PROCESSING..." /> : <TranslatedText text="INITIALIZE ASSET" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Truck Modal */}
      {showEditModal && editingTruck && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-white/20 animate-in fade-in zoom-in duration-300">
            <div className="bg-indigo-600 px-8 py-6 flex items-center justify-between">
              <div>
                <h2 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1"><TranslatedText text="Asset Modification" /></h2>
                <h3 className="text-xl font-black text-white uppercase tracking-tight"><TranslatedText text="Edit Truck Identity" /></h3>
              </div>
              <button
                onClick={() => { setShowEditModal(false); setEditingTruck(null); }}
                className="w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-xl flex items-center justify-center transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-8 bg-[#fafafa]">
              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                    <TranslatedText text="Core Identity" />
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1"><TranslatedText text="Plate Number" /></label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 text-[10px] font-black uppercase tracking-widest bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                        value={editingTruck.plateNumber || ''}
                        onChange={(e) => setEditingTruck({ ...editingTruck, plateNumber: e.target.value.toUpperCase() })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1"><TranslatedText text="Manufacturing Year" /></label>
                      <input
                        type="number"
                        className="w-full px-4 py-3 text-[10px] font-black uppercase tracking-widest bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                        value={editingTruck.year || ''}
                        onChange={(e) => setEditingTruck({ ...editingTruck, year: Number(e.target.value) || new Date().getFullYear() })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1"><TranslatedText text="Manufacturer" /></label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 text-[10px] font-black uppercase tracking-widest bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                        value={editingTruck.make || ''}
                        onChange={(e) => setEditingTruck({ ...editingTruck, make: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1"><TranslatedText text="Model" /></label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 text-[10px] font-black uppercase tracking-widest bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                        value={editingTruck.model || ''}
                        onChange={(e) => setEditingTruck({ ...editingTruck, model: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                    <TranslatedText text="Load Parameters" />
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1"><TranslatedText text="Weight Capacity (KG)" /></label>
                      <input
                        type="number"
                        className="w-full px-4 py-3 text-[10px] font-black uppercase tracking-widest bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                        value={editingTruck.capacityWeight || ''}
                        onChange={(e) => setEditingTruck({ ...editingTruck, capacityWeight: Number(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1"><TranslatedText text="Volume Capacity (M³)" /></label>
                      <input
                        type="number"
                        className="w-full px-4 py-3 text-[10px] font-black uppercase tracking-widest bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                        value={editingTruck.capacityVolume || ''}
                        onChange={(e) => setEditingTruck({ ...editingTruck, capacityVolume: Number(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                    <TranslatedText text="Operational Status" />
                  </h4>
                  <select
                    className="w-full px-4 py-3 text-[10px] font-black uppercase tracking-widest bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm cursor-pointer"
                    value={editingTruck.status || 'available'}
                    onChange={(e) => setEditingTruck({ ...editingTruck, status: e.target.value })}
                  >
                    <option value="available"><TranslatedText text="AVAILABLE" /></option>
                    <option value="in_use"><TranslatedText text="IN USE" /></option>
                    <option value="on_trip"><TranslatedText text="ON TRIP" /></option>
                    <option value="maintenance"><TranslatedText text="MAINTENANCE" /></option>
                    <option value="unavailable"><TranslatedText text="UNAVAILABLE" /></option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => { setShowEditModal(false); setEditingTruck(null); }}
                  className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <TranslatedText text="Discard" />
                </button>
                <button
                  onClick={() => updateTruck()}
                  disabled={isUpdating || !editingTruck.plateNumber || !editingTruck.make || !editingTruck.model}
                  className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg hover:shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isUpdating ? <TranslatedText text="SAVING..." /> : <TranslatedText text="COMMIT CHANGES" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Truck Details Modal */}
      {showDetailsModal && selectedTruck && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-white/20 animate-in fade-in zoom-in duration-300 flex flex-col">
            {/* Modal Header */}
            <div className="bg-slate-900 px-8 py-8 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                  <LucideTruck className="text-white" size={32} />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">{selectedTruck.plateNumber}</h2>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(selectedTruck.status)} bg-white/5`}>
                      {selectedTruck.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm font-black text-slate-400 uppercase tracking-widest">{selectedTruck.make} — {selectedTruck.model} ({selectedTruck.year})</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => { handleEditTruck(selectedTruck); setShowDetailsModal(false); }}
                  className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-white/10"
                >
                  <TranslatedText text="Modify Asset" />
                </button>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="w-12 h-12 bg-white/5 hover:bg-rose-500/20 text-white hover:text-rose-400 rounded-xl flex items-center justify-center transition-all border border-white/10 hover:border-rose-500/30"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-[#fafafa] space-y-8">
              {/* Performance Metrics Section */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { label: <TranslatedText text="Weight Capacity" />, value: `${(selectedTruck.capacityWeight || 0).toLocaleString()}`, unit: 'KG', icon: Milestone, color: 'indigo' },
                  { label: <TranslatedText text="Volume Capacity" />, value: `${(selectedTruck.capacityVolume || 0).toLocaleString()}`, unit: 'M³', icon: LucideTruck, color: 'slate' },
                  { label: <TranslatedText text="Asset Utilization" />, value: `${selectedTruck.totalTrips || 0}`, unit: <TranslatedText text="TRIPS" />, icon: Check, color: 'emerald' },
                  { label: <TranslatedText text="Driver Satisfaction" />, value: `${Number(selectedTruck.averageRating || 0).toFixed(1)}`, unit: '/ 5.0', icon: Clock, color: 'amber' }
                ].map((metric, i) => (
                  <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                    <metric.icon className="absolute -right-4 -bottom-4 text-gray-100 group-hover:text-gray-200 transition-colors" size={80} />
                    <div className="relative">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{metric.label}</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-slate-900 tracking-tight">{metric.value}</span>
                        <span className="text-[10px] font-black text-slate-400">{metric.unit}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Technical Specifications */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                    <TranslatedText text="Asset Intelligence" />
                  </h4>
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                    {[
                      { label: <TranslatedText text="Registry Plate" />, value: selectedTruck.plateNumber },
                      { label: <TranslatedText text="Manufacturer" />, value: selectedTruck.make },
                      { label: <TranslatedText text="Model Spec" />, value: selectedTruck.model },
                      { label: <TranslatedText text="Odometer (KM)" />, value: `${(selectedTruck.mileage || 0).toLocaleString()} km` },
                      { label: <TranslatedText text="Current Vector" />, value: selectedTruck.currentLocationString || <TranslatedText text="STATIONARY" /> },
                      { label: <TranslatedText text="Efficiency" />, value: selectedTruck.fuelEfficiency ? `${selectedTruck.fuelEfficiency} km/L` : <TranslatedText text="CALCULATING..." /> }
                    ].map((row, i) => (
                      <div key={i} className="px-6 py-4 flex items-center justify-between border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{row.label}</span>
                        <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Organization & Fiscal Data */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                    <TranslatedText text="Operational Structure" />
                  </h4>
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-gray-50">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4"><TranslatedText text="Total Asset Revenue" /></p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-[10px] font-black text-slate-400">RWF</span>
                        <span className="text-4xl font-black text-slate-900 tracking-tighter">
                          {(selectedTruck.totalRevenue || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    {[
                      { label: <TranslatedText text="Assigned Tenant" />, value: selectedTruck.tenantName || <TranslatedText text="UNASSIGNED" /> },
                      { label: <TranslatedText text="Equity Owner" />, value: selectedTruck.ownerName || <TranslatedText text="PLATFORM ASSET" /> },
                      { label: <TranslatedText text="Registry Date" />, value: new Date(selectedTruck.createdAt).toLocaleDateString() }
                    ].map((row, i) => (
                      <div key={i} className="px-6 py-4 flex items-center justify-between border-b border-gray-50 last:border-0">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{row.label}</span>
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Personnel Assignment Section */}
              {selectedTruck.assignedDrivers && selectedTruck.assignedDrivers.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    <TranslatedText text="Assigned Human Capital" />
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedTruck.assignedDrivers.map((driver: any, index: number) => (
                      <div key={index} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100">
                            <User className="text-emerald-600" size={18} />
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{driver.driverName || <TranslatedText text="IDENTIFYING..." />}</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest"><TranslatedText text="Active Operator" /></p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest"><TranslatedText text="Commissioned" /></p>
                          <p className="text-[10px] font-black text-slate-600 tracking-tight">{new Date(driver.assignmentDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminPageLayout >
  );
};

export default AdminTrucks;
