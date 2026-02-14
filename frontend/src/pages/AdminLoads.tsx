import React, { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { loadsAPI } from '../services/load';
import { fetchTenants, fetchAllUsers, fetchAllLoads } from '../services/adminApi';
import AdminPageLayout from '../components/Admin/AdminPageLayout';

import {
  Package, Search, Download,
  Eye, Check, X, Ban, MapPin,
  ChevronsUpDown, User, Building2,
  AlertTriangle, Play, Pause,
  Trash2, DollarSign, Weight, Box, Calendar
} from 'lucide-react';

interface Load {
  id: string;
  title: string;
  description?: string;
  weight: number;
  volume?: number;
  cargoType: string;
  status: string;
  tenantId?: string;
  tenantName?: string;
  cargoOwnerId?: string;
  cargoOwnerName?: string;
  cargoOwner?: {
    id: string;
    email: string;
    profile?: {
      firstName?: string;
      lastName?: string;
      companyName?: string;
    };
  };
  pickupDate?: string;
  deliveryDate?: string;
  offeredPrice?: number;
  loadValue?: number;
  currencyCode?: string;
  urgencyLevel?: string;
  pickupLocation?: {
    name?: string;
    address?: string;
  };
  deliveryLocation?: {
    name?: string;
    address?: string;
  };
  locations?: any[];
  createdAt: string;
  updatedAt: string;
}

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  status: string;
}

const AdminLoads: React.FC = () => {
  const qc = useQueryClient();



  // Fetch data - try admin endpoint first, fallback to regular endpoint
  const { data: loadsData, isLoading: loadsLoading, error: loadsError } = useQuery({
    queryKey: ['admin-loads'],
    queryFn: async () => {
      try {
        // Try admin endpoint first
        try {
          const adminLoads = await fetchAllLoads();
          if (adminLoads && Array.isArray(adminLoads) && adminLoads.length > 0) {
            console.log('Found loads via admin API:', adminLoads.length);
            return adminLoads;
          }
        } catch (adminError) {
          console.log('Admin loads endpoint failed, trying regular endpoint:', adminError);
        }

        // Fallback to regular loads endpoint
        const response = await loadsAPI.getAll();
        console.log('Loads API Response:', response);
        console.log('Response data:', response.data);

        // Handle different response structures
        // Backend returns: { items: [], total, page, ... } or { data: { items: [] } }
        const data = response.data?.data || response.data;

        // Try items array first (paginated response)
        if (data?.items && Array.isArray(data.items)) {
          console.log('Found loads in data.items:', data.items.length);
          return data.items;
        }

        // Try loads array
        if (data?.loads && Array.isArray(data.loads)) {
          console.log('Found loads in data.loads:', data.loads.length);
          return data.loads;
        }

        // Try direct array
        if (Array.isArray(data)) {
          console.log('Found loads as direct array:', data.length);
          return data;
        }

        // Try response.data as array
        if (Array.isArray(response.data)) {
          console.log('Found loads in response.data:', response.data.length);
          return response.data;
        }

        console.warn('Unexpected loads response structure:', {
          responseData: response.data,
          data: data,
          keys: data ? Object.keys(data) : 'no data'
        });
        return [];
      } catch (error: any) {
        console.error('Error fetching loads:', error);
        console.error('Error response:', error?.response?.data);
        throw error;
      }
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

  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cargoTypeFilter, setCargoTypeFilter] = useState<string>('all');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedLoad, setSelectedLoad] = useState<Load | null>(null);
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedLoadIds, setSelectedLoadIds] = useState<string[]>([]);

  // Get tenants for mapping
  const tenants: Tenant[] = tenantsData?.tenants || [];
  const tenantMap = new Map<string, string>();
  tenants.forEach((tenant) => {
    tenantMap.set(tenant.id, tenant.name);
  });

  // Get users for cargo owner mapping
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

  // Map loads with tenant and owner names
  const loads: Load[] = useMemo(() => {
    if (!loadsData || !Array.isArray(loadsData)) return [];
    return loadsData.map((load: any) => {
      let ownerName = 'N/A';
      if (load.cargoOwnerId) {
        ownerName = ownerMap.get(load.cargoOwnerId) || 'N/A';
        if (ownerName === 'N/A' && load.cargoOwner) {
          if (load.cargoOwner.profile?.firstName || load.cargoOwner.profile?.lastName) {
            ownerName = `${load.cargoOwner.profile.firstName || ''} ${load.cargoOwner.profile.lastName || ''}`.trim() || load.cargoOwner.profile.companyName || load.cargoOwner.email || 'N/A';
          } else if (load.cargoOwner.profile?.companyName) {
            ownerName = load.cargoOwner.profile.companyName;
          } else if (load.cargoOwner.email) {
            ownerName = load.cargoOwner.email;
          }
        }
      }

      // Extract pickup and delivery locations
      let pickupLocation: any = null;
      let deliveryLocation: any = null;
      if (load.locations && Array.isArray(load.locations)) {
        pickupLocation = load.locations.find((loc: any) => loc.type === 'PICKUP');
        deliveryLocation = load.locations.find((loc: any) => loc.type === 'DELIVERY');
      }

      return {
        ...load,
        tenantId: load.tenantId,
        tenantName: load.tenantId ? (tenantMap.get(load.tenantId) || 'N/A') : 'N/A',
        cargoOwnerId: load.cargoOwnerId,
        cargoOwnerName: ownerName,
        pickupLocation: pickupLocation?.locationData || load.pickupLocation,
        deliveryLocation: deliveryLocation?.locationData || load.deliveryLocation
      };
    });
  }, [loadsData, tenantMap, ownerMap]);

  // Delete mutation
  const { mutate: deleteLoad } = useMutation({
    mutationFn: (loadId: string) => loadsAPI.delete(loadId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-loads'] });
      setShowDetailsModal(false);
      setSelectedLoad(null);
      toast.success('Load deleted successfully!');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to delete load. Please try again.';
      toast.error(errorMessage);
    }
  });

  const handleDeleteLoad = (loadId: string) => {
    if (window.confirm('Are you sure you want to delete this load? This action cannot be undone.')) {
      deleteLoad(loadId);
    }
  };

  // Filter and sort loads
  const filteredLoads = loads
    .filter((load: Load) => {
      const matchesSearch = load.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        load.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        load.tenantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        load.cargoOwnerName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || load.status === statusFilter;
      const matchesCargoType = cargoTypeFilter === 'all' || load.cargoType === cargoTypeFilter;
      return matchesSearch && matchesStatus && matchesCargoType;
    })
    .sort((a: Load, b: Load) => {
      const aValue = a[sortBy as keyof Load] || '';
      const bValue = b[sortBy as keyof Load] || '';
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });

  const total = filteredLoads.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const pagedLoads = filteredLoads.slice(startIdx, endIdx);

  // Calculate stats
  const stats = [
    {
      label: 'Total Loads',
      value: loads.length,
      description: 'All registered loads',
      color: 'bg-gray-800',
      icon: Package
    },
    {
      label: 'Active',
      value: loads.filter((l: Load) => l.status === 'CREATED' || l.status === 'PUBLISHED' || l.status === 'IN_PROGRESS').length,
      description: 'Currently active',
      color: 'bg-gray-800',
      icon: Play
    },
    {
      label: 'Draft',
      value: loads.filter((l: Load) => l.status === 'DRAFT').length,
      description: 'Draft loads',
      color: 'bg-gray-800',
      icon: Pause
    },
    {
      label: 'Completed',
      value: loads.filter((l: Load) => l.status === 'COMPLETED' || l.status === 'DELIVERED').length,
      description: 'Completed deliveries',
      color: 'bg-gray-800',
      icon: Check
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CREATED':
      case 'PUBLISHED':
      case 'IN_PROGRESS': return 'bg-green-100 text-green-800';
      case 'DRAFT': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
      case 'DELIVERED': return 'bg-blue-100 text-blue-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CREATED':
      case 'PUBLISHED':
      case 'IN_PROGRESS': return <Play className="text-green-500" size={10} />;
      case 'DRAFT': return <Pause className="text-yellow-500" size={10} />;
      case 'COMPLETED':
      case 'DELIVERED': return <Check className="text-blue-500" size={10} />;
      case 'CANCELLED': return <Ban className="text-red-500" size={10} />;
      default: return <Pause className="text-gray-500" size={10} />;
    }
  };

  const getCargoTypeColor = (cargoType: string) => {
    switch (cargoType) {
      case 'FRAGILE': return 'bg-red-100 text-red-800';
      case 'HAZARDOUS': return 'bg-orange-100 text-orange-800';
      case 'REFRIGERATED': return 'bg-blue-100 text-blue-800';
      case 'GENERAL': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loadsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
        <span className="ml-2 text-sm text-gray-600">Loading loads...</span>
      </div>
    );
  }

  if (loadsError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <AlertTriangle className="text-red-600" size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Error Loading Loads</h2>
            <p className="text-sm text-gray-600 mt-0.5">Please try refreshing the page or contact support.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminPageLayout
      title="Load Management"
      description="Manage cargo loads and shipments"
    >

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search loads..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="CREATED">Created</option>
            <option value="PUBLISHED">Published</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
            value={cargoTypeFilter}
            onChange={(e) => setCargoTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="GENERAL">General</option>
            <option value="FRAGILE">Fragile</option>
            <option value="HAZARDOUS">Hazardous</option>
            <option value="REFRIGERATED">Refrigerated</option>
            <option value="LIVESTOCK">Livestock</option>
            <option value="VEHICLES">Vehicles</option>
          </select>

          <button className="px-3 py-2 text-sm border border-gray-200 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors text-gray-600">
            <Download size={16} />
            <span>Export</span>
          </button>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <div className="text-xs text-gray-600">
            {selectedLoadIds.length > 0 ? `${selectedLoadIds.length} selected` : `${total} loads`}
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

      {/* Loads Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="px-2 py-1.5 w-8">
                  <input
                    type="checkbox"
                    checked={selectedLoadIds.length > 0 && selectedLoadIds.length === pagedLoads.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedLoadIds(pagedLoads.map((l: Load) => l.id));
                      } else {
                        setSelectedLoadIds([]);
                      }
                    }}
                  />
                </th>
                <th className="px-3 py-3 text-left font-black text-gray-900 text-xs">
                  <button
                    className="flex items-center gap-1"
                    onClick={() => {
                      setSortBy('title');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    <span>Load</span>
                    <ChevronsUpDown size={14} />
                  </button>
                </th>
                <th className="px-3 py-3 text-left font-black text-gray-900 text-xs">Cargo Details</th>
                <th className="px-3 py-3 text-left font-black text-gray-900 text-xs">Route</th>
                <th className="px-3 py-3 text-left font-black text-gray-900 text-xs">Status</th>
                <th className="px-3 py-3 text-left font-black text-gray-900 text-xs">Organization</th>
                <th className="px-3 py-3 text-left font-black text-gray-900 text-xs">Value</th>
                <th className="px-3 py-3 text-center font-black text-gray-900 text-xs">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pagedLoads.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-2 py-8 text-center text-xs text-gray-500">
                    No loads found
                  </td>
                </tr>
              ) : (
                pagedLoads.map((load: Load) => (
                  <tr key={load.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-2 py-1.5 w-8">
                      <input
                        type="checkbox"
                        checked={selectedLoadIds.includes(load.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedLoadIds([...selectedLoadIds, load.id]);
                          } else {
                            setSelectedLoadIds(selectedLoadIds.filter(id => id !== load.id));
                          }
                        }}
                      />
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100">
                          <Package className="text-indigo-600" size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{load.title}</p>
                          <p className="text-[10px] text-gray-500 truncate mt-0.5">{load.description || 'No description'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <Weight className="text-gray-400" size={12} />
                          <span className="text-[11px] font-bold text-gray-900">{(load.weight || 0).toLocaleString()} kg</span>
                        </div>
                        {load.volume && (
                          <div className="flex items-center gap-1.5">
                            <Box className="text-gray-400" size={12} />
                            <span className="text-[10px] text-gray-500">{(load.volume || 0).toLocaleString()} m³</span>
                          </div>
                        )}
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${getCargoTypeColor(load.cargoType || 'GENERAL')}`}>
                          {load.cargoType || 'GENERAL'}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <div className="space-y-1.5">
                        {load.pickupLocation && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="text-green-500" size={10} />
                            <span className="text-[10px] text-gray-600 font-medium truncate max-w-[120px]" title={load.pickupLocation.name || load.pickupLocation.address}>
                              {load.pickupLocation.name || load.pickupLocation.address || 'Pickup'}
                            </span>
                          </div>
                        )}
                        {load.deliveryLocation && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="text-red-500" size={10} />
                            <span className="text-[10px] text-gray-600 font-medium truncate max-w-[120px]" title={load.deliveryLocation.name || load.deliveryLocation.address}>
                              {load.deliveryLocation.name || load.deliveryLocation.address || 'Delivery'}
                            </span>
                          </div>
                        )}
                        {load.pickupDate && (
                          <div className="flex items-center gap-1.5 mt-1 pt-1 border-t border-gray-50">
                            <Calendar className="text-gray-400" size={10} />
                            <span className="text-[10px] text-gray-500">{new Date(load.pickupDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex items-center gap-1">
                        {getStatusIcon(load.status)}
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(load.status)}`}>
                          {load.status.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Building2 className="text-indigo-600" size={12} />
                          </div>
                          <span className="text-[11px] text-gray-900 font-bold truncate max-w-[100px]">
                            {load.tenantName || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <User className="text-gray-600" size={12} />
                          </div>
                          <span className="text-[11px] text-gray-900 font-bold truncate max-w-[100px]">
                            {load.cargoOwnerName || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <div className="space-y-1">
                        {load.offeredPrice && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="text-green-600" size={12} />
                            <span className="text-[11px] font-black text-gray-900">{(load.offeredPrice || 0).toLocaleString()}</span>
                            <span className="text-[9px] text-gray-500 font-bold">{load.currencyCode || 'RWF'}</span>
                          </div>
                        )}
                        {load.loadValue && (
                          <div className="text-[10px] text-gray-500 font-medium">
                            Value: {(load.loadValue || 0).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedLoad(load);
                            setShowDetailsModal(true);
                          }}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteLoad(load.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
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

      {/* Load Details Modal */}
      {showDetailsModal && selectedLoad && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100">
                    <Package className="text-indigo-600" size={18} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{selectedLoad.title}</h2>
                    <p className="text-xs text-gray-500">{selectedLoad.description || 'No description'}</p>
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
                  {getStatusIcon(selectedLoad.status)}
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(selectedLoad.status)}`}>
                    {selectedLoad.status.replace('_', ' ')}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getCargoTypeColor(selectedLoad.cargoType || 'GENERAL')}`}>
                    {selectedLoad.cargoType || 'GENERAL'}
                  </span>
                  {selectedLoad.urgencyLevel && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-orange-100 text-orange-800">
                      {selectedLoad.urgencyLevel} Priority
                    </span>
                  )}
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-100">
                  <div className="flex items-center space-x-2">
                    <Weight className="text-indigo-600" size={16} />
                    <div>
                      <div className="text-sm font-black text-indigo-900">{(selectedLoad.weight || 0).toLocaleString()}</div>
                      <div className="text-[10px] text-indigo-700">Weight (kg)</div>
                    </div>
                  </div>
                </div>

                {selectedLoad.volume && (
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <div className="flex items-center space-x-2">
                      <Box className="text-gray-600" size={16} />
                      <div>
                        <div className="text-sm font-black text-gray-900">{(selectedLoad.volume || 0).toLocaleString()}</div>
                        <div className="text-[10px] text-gray-500">Volume (m³)</div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedLoad.offeredPrice && (
                  <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="text-green-600" size={16} />
                      <div>
                        <div className="text-sm font-black text-green-900">{(selectedLoad.offeredPrice || 0).toLocaleString()}</div>
                        <div className="text-[10px] text-green-700">Offered Price</div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedLoad.loadValue && (
                  <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-100">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="text-yellow-600" size={16} />
                      <div>
                        <div className="text-sm font-black text-yellow-900">{(selectedLoad.loadValue || 0).toLocaleString()}</div>
                        <div className="text-[10px] text-yellow-700">Load Value</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Load Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-gray-900">Load Information</h3>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Title:</span>
                      <span className="font-medium">{selectedLoad.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cargo Type:</span>
                      <span className="font-medium">{selectedLoad.cargoType || 'GENERAL'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Weight:</span>
                      <span className="font-medium">{(selectedLoad.weight || 0).toLocaleString()} kg</span>
                    </div>
                    {selectedLoad.volume && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Volume:</span>
                        <span className="font-medium">{(selectedLoad.volume || 0).toLocaleString()} m³</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tenant:</span>
                      <span className="font-medium">{selectedLoad.tenantName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cargo Owner:</span>
                      <span className="font-medium">{selectedLoad.cargoOwnerName || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-gray-900">Route & Dates</h3>
                  <div className="space-y-1.5 text-xs">
                    {selectedLoad.pickupLocation && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pickup:</span>
                        <span className="font-medium">{selectedLoad.pickupLocation.name || selectedLoad.pickupLocation.address || 'N/A'}</span>
                      </div>
                    )}
                    {selectedLoad.deliveryLocation && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Delivery:</span>
                        <span className="font-medium">{selectedLoad.deliveryLocation.name || selectedLoad.deliveryLocation.address || 'N/A'}</span>
                      </div>
                    )}
                    {selectedLoad.pickupDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pickup Date:</span>
                        <span className="font-medium">{new Date(selectedLoad.pickupDate).toLocaleString()}</span>
                      </div>
                    )}
                    {selectedLoad.deliveryDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Delivery Date:</span>
                        <span className="font-medium">{new Date(selectedLoad.deliveryDate).toLocaleString()}</span>
                      </div>
                    )}
                    {selectedLoad.offeredPrice && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Offered Price:</span>
                        <span className="font-medium">{(selectedLoad.offeredPrice || 0).toLocaleString()} {selectedLoad.currencyCode || 'RWF'}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium">{new Date(selectedLoad.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedLoad.description && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-gray-900">Description</h3>
                  <p className="text-xs text-gray-700 bg-gray-50 p-2 rounded-lg">{selectedLoad.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
};

export default AdminLoads;
