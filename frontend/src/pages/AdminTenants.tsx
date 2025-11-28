import React, { useState, useMemo, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createTenant, fetchTenants, getTenantById, updateTenant } from '../services/adminApi';
import toast from 'react-hot-toast';
import TenantSettingsModal from '../components/TenantSettingsModal';
import ManageUsersModal from '../components/ManageUsersModal';
import { 
  FaBuilding, FaEdit, FaPlus, FaSearch, FaDownload,
  FaEye, FaCheck, FaTimes, FaBan,
  FaSort, FaGlobe, FaUsers, FaChartLine,
  FaCalendarAlt, FaCog, FaShieldAlt, FaExclamationTriangle,
  FaTruck
} from 'react-icons/fa';

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  createdAt: string;
  lastActivity: string;
  userCount?: number;
  trucksCount?: number;
  revenue?: number;
  plan: 'starter' | 'professional' | 'enterprise';
  domain?: string;
  contactEmail?: string;
  adminName?: string;
  location?: string;
}

const AdminTenants: React.FC = () => {
  const qc = useQueryClient();
  
  // Fetch tenants from API
  const { data: tenantsData, isLoading: isLoadingTenants, error: tenantsError } = useQuery({ 
    queryKey: ['admin-tenants'], 
    queryFn: async () => {
      try {
        const result = await fetchTenants();
        return result;
      } catch (error: any) {
        console.error("Error fetching tenants:", error);
        throw error;
      }
    }
  });

  // Form state
  const [name, setName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [domain, setDomain] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [plan, setPlan] = useState<'starter' | 'professional' | 'enterprise'>('starter');
  
  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTenantId, setEditingTenantId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsTenantId, setSettingsTenantId] = useState<string | null>(null);
  const [showManageUsersModal, setShowManageUsersModal] = useState(false);
  const [manageUsersTenantId, setManageUsersTenantId] = useState<string | null>(null);
  const [manageUsersTenantName, setManageUsersTenantName] = useState<string>('');

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editSubdomain, setEditSubdomain] = useState('');
  const [editDomain, setEditDomain] = useState('');
  const [editContactEmail, setEditContactEmail] = useState('');
  const [editContactPhone, setEditContactPhone] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [editCountry, setEditCountry] = useState('');
  const [editPostalCode, setEditPostalCode] = useState('');
  const [editWebsiteUrl, setEditWebsiteUrl] = useState('');
  const [editPlan, setEditPlan] = useState<'starter' | 'professional' | 'enterprise'>('starter');

  // Map backend status to frontend status format
  const mapBackendStatus = (status: string): 'active' | 'inactive' | 'pending' | 'suspended' => {
    const statusMap: Record<string, 'active' | 'inactive' | 'pending' | 'suspended'> = {
      'ACTIVE': 'active',
      'PENDING_ACTIVATION': 'pending',
      'SUSPENDED': 'suspended',
      'DEACTIVATED': 'inactive',
    };
    return statusMap[status] || 'pending';
  };

  // Map backend subscriptionPlan to frontend plan format
  const mapBackendPlan = (subscriptionPlan?: string): 'starter' | 'professional' | 'enterprise' => {
    if (!subscriptionPlan) return 'starter';
    const planMap: Record<string, 'starter' | 'professional' | 'enterprise'> = {
      'STARTER': 'starter',
      'PROFESSIONAL': 'professional',
      'ENTERPRISE': 'enterprise',
    };
    return planMap[subscriptionPlan.toUpperCase()] || 'starter';
  };

  // Transform backend tenants data to frontend format
  const tenants = useMemo(() => {
    if (!tenantsData?.tenants || !Array.isArray(tenantsData.tenants)) {
      return [];
    }
    
    const transformed = tenantsData.tenants.map((tenant: any) => {
      const mapped = {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain || '',
        status: mapBackendStatus(tenant.status || 'PENDING_ACTIVATION'),
        createdAt: tenant.createdAt ? new Date(tenant.createdAt).toISOString() : new Date().toISOString(),
        lastActivity: tenant.updatedAt ? new Date(tenant.updatedAt).toISOString() : tenant.createdAt ? new Date(tenant.createdAt).toISOString() : new Date().toISOString(),
        userCount: 0, // Will be populated from relations if available
        trucksCount: 0, // Will be populated from relations if available
        revenue: 0, // Will be calculated from billing data if available
        plan: mapBackendPlan(tenant.subscriptionPlan),
        domain: tenant.domain || '',
        contactEmail: tenant.contactEmail || '',
        adminName: '', // Will be populated from admin user relation if available
        location: tenant.city && tenant.country ? `${tenant.city}, ${tenant.country}` : tenant.country || tenant.city || '',
      };
      return mapped;
    });
    
    return transformed;
  }, [tenantsData]);

  const { mutate, isPending: isCreating } = useMutation({
    mutationFn: (payload: any) => createTenant(payload),
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ['admin-tenants'] }); 
      resetForm();
      setShowCreateModal(false);
      toast.success('Tenant created successfully!');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.error || 
                          error?.message || 
                          'Failed to create tenant. Please try again.';
      toast.error(errorMessage);
    },
  });

  // Fetch tenant details for editing
  const { data: tenantDetails, isLoading: isLoadingTenantDetails } = useQuery({
    queryKey: ['tenant-details', editingTenantId],
    queryFn: () => getTenantById(editingTenantId!),
    enabled: !!editingTenantId && showEditModal,
  });

  // Update mutation
  const { mutate: updateTenantMutation, isPending: isUpdating } = useMutation({
    mutationFn: (payload: any) => updateTenant(editingTenantId!, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-tenants'] });
      qc.invalidateQueries({ queryKey: ['tenant-details', editingTenantId] });
      setShowEditModal(false);
      setEditingTenantId(null);
      resetEditForm();
      toast.success('Tenant updated successfully!');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.error || 
                          error?.message || 
                          'Failed to update tenant. Please try again.';
      toast.error(errorMessage);
    },
  });

  const resetForm = () => {
    setName('');
    setSubdomain('');
    setDomain('');
    setContactEmail('');
    setPlan('starter');
  };

  const resetEditForm = () => {
    setEditName('');
    setEditSubdomain('');
    setEditDomain('');
    setEditContactEmail('');
    setEditContactPhone('');
    setEditDescription('');
    setEditAddress('');
    setEditCity('');
    setEditState('');
    setEditCountry('');
    setEditPostalCode('');
    setEditWebsiteUrl('');
    setEditPlan('starter');
  };

  // Populate edit form when tenant details are loaded
  useEffect(() => {
    if (tenantDetails?.data && showEditModal) {
      const tenant = tenantDetails.data;
      setEditName(tenant.name || '');
      setEditSubdomain(tenant.subdomain || '');
      setEditDomain(tenant.domain || '');
      setEditContactEmail(tenant.contactEmail || '');
      setEditContactPhone(tenant.contactPhone || '');
      setEditDescription(tenant.description || '');
      setEditAddress(tenant.address || '');
      setEditCity(tenant.city || '');
      setEditState(tenant.state || '');
      setEditCountry(tenant.country || '');
      setEditPostalCode(tenant.postalCode || '');
      setEditWebsiteUrl(tenant.websiteUrl || '');
      setEditPlan(mapBackendPlan(tenant.subscriptionPlan));
    }
  }, [tenantDetails, showEditModal]);

  const handleEditTenant = (tenant: Tenant) => {
    setEditingTenantId(tenant.id);
    setShowEditModal(true);
  };

  const handleUpdateTenant = () => {
    updateTenantMutation({
      name: editName.trim(),
      subdomain: editSubdomain.trim().toLowerCase(),
      domain: editDomain.trim() || undefined,
      contactEmail: editContactEmail.trim().toLowerCase(),
      contactPhone: editContactPhone.trim() || undefined,
      description: editDescription.trim() || undefined,
      address: editAddress.trim() || undefined,
      city: editCity.trim() || undefined,
      state: editState.trim() || undefined,
      country: editCountry.trim() || undefined,
      postalCode: editPostalCode.trim() || undefined,
      websiteUrl: editWebsiteUrl.trim() || undefined,
      subscriptionPlan: editPlan || undefined,
    });
  };

  // Filter and sort tenants
  const filteredTenants = tenants
    .filter((tenant: Tenant) => {
      const matchesSearch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          tenant.subdomain.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          tenant.contactEmail?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter;
      const matchesPlan = planFilter === 'all' || tenant.plan === planFilter;
      return matchesSearch && matchesStatus && matchesPlan;
    })
    .sort((a: Tenant, b: Tenant) => {
      const aValue = a[sortBy as keyof Tenant] || '';
      const bValue = b[sortBy as keyof Tenant] || '';
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-gray-100 text-gray-700';
      case 'inactive': return 'bg-gray-100 text-gray-500';
      case 'pending': return 'bg-gray-100 text-gray-600';
      case 'suspended': return 'bg-gray-100 text-gray-500';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'starter': return 'bg-gray-100 text-gray-700';
      case 'professional': return 'bg-gray-100 text-gray-700';
      case 'enterprise': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <FaCheck className="text-gray-600" />;
      case 'inactive': return <FaTimes className="text-gray-400" />;
      case 'pending': return <FaExclamationTriangle className="text-gray-500" />;
      case 'suspended': return <FaBan className="text-gray-400" />;
      default: return <FaTimes className="text-gray-400" />;
    }
  };

  const handleCreateTenant = () => {
    // Use default admin names since admin info is stored in User entity, not Tenant
    const adminFirstName = 'Admin';
    const adminLastName = 'User';
    
    // Generate a secure temporary password (8+ chars as required by backend)
    // Note: In production, consider using a password reset email flow instead
    const generateTempPassword = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
      let password = '';
      for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    };
    const tempPassword = generateTempPassword();
    
    mutate({
      name: name.trim(),
      subdomain: subdomain.trim().toLowerCase(),
      domain: domain.trim() || undefined,
      contactEmail: contactEmail.trim().toLowerCase(),
      adminFirstName,
      adminLastName,
      adminPassword: tempPassword,
      plan: plan || 'starter'
    });
  };

  const stats = [
    { label: 'Total Tenants', value: tenants.length, icon: FaBuilding, color: 'from-gray-600 to-gray-700' },
    { label: 'Active Tenants', value: tenants.filter((t: Tenant) => t.status === 'active').length, icon: FaCheck, color: 'from-gray-600 to-gray-700' },
    { label: 'Total Users', value: tenants.reduce((sum: number, t: Tenant) => sum + (t.userCount || 0), 0), icon: FaUsers, color: 'from-gray-600 to-gray-700' },
    { label: 'Total Revenue', value: `$${tenants.reduce((sum: number, t: Tenant) => sum + (t.revenue || 0), 0).toLocaleString()}`, icon: FaChartLine, color: 'from-gray-600 to-gray-700' },
  ];

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Tenant Management</h1>
          <p className="text-xs text-gray-600 mt-0.5">Manage platform tenants and their configurations</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-gray-800 text-white px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-gray-900 transition-all duration-200 shadow-sm text-xs font-medium"
        >
          <FaPlus className="w-3 h-3" />
          <span>Add Tenant</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5 hover:shadow-md transition-all duration-200 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity bg-gray-50"></div>
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-gray-600 mb-0.5">{stat.label}</p>
                    <p className="text-lg font-bold text-gray-900 mb-0.5">{stat.value}</p>
                  </div>
                  <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center group-hover:bg-gray-800 transition-colors">
                    <Icon className="text-white text-sm" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm p-2.5 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <div className="relative">
            <FaSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="Search tenants..."
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
          </select>

          <select
            className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
          >
            <option value="all">All Plans</option>
            <option value="starter">Starter</option>
            <option value="professional">Professional</option>
            <option value="enterprise">Enterprise</option>
          </select>

          <button className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors">
            <FaDownload className="w-3 h-3" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        {isLoadingTenants ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
            <span className="ml-3 text-xs text-gray-600">Loading tenants...</span>
          </div>
        ) : tenantsError ? (
          <div className="p-3 text-center">
            <div className="text-gray-600 mb-1.5">
              <FaExclamationTriangle className="text-lg mx-auto mb-1.5" />
              <p className="text-xs">Failed to load tenants. Please try again.</p>
              {tenantsError instanceof Error && (
                <p className="text-[10px] text-gray-500 mt-1">{tenantsError.message}</p>
              )}
            </div>
          </div>
        ) : filteredTenants.length === 0 ? (
          <div className="p-3 text-center">
            <FaBuilding className="text-xl text-gray-400 mx-auto mb-1.5" />
            <p className="text-xs text-gray-600">No tenants found</p>
            {searchTerm || statusFilter !== 'all' || planFilter !== 'all' ? (
              <p className="text-[10px] text-gray-500 mt-1">Try adjusting your filters</p>
            ) : null}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-900">
                    <button 
                      className="flex items-center gap-1"
                      onClick={() => {
                        setSortBy('name');
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      }}
                    >
                      <span>Tenant</span>
                      <FaSort className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-900">Domain</th>
                  <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-900">Plan</th>
                  <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-900">Status</th>
                  <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-900">Users</th>
                  <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-900">Revenue</th>
                  <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-900">Last Activity</th>
                  <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTenants.map((tenant: Tenant) => (
                <tr key={tenant.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-2 py-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
                        <FaBuilding className="text-white text-xs" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 text-xs">{tenant.name}</div>
                        <div className="text-[10px] text-gray-500">{tenant.adminName}</div>
                        <div className="text-[10px] text-gray-400">{tenant.location}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-1.5">
                    <div className="flex items-center gap-0.5">
                      <FaGlobe className="text-gray-400 text-xs" />
                      <span className="text-xs text-gray-900">{tenant.domain}</span>
                    </div>
                    <div className="text-[10px] text-gray-500">{tenant.contactEmail}</div>
                  </td>
                  <td className="px-2 py-1.5">
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getPlanColor(tenant.plan)}`}>
                      {tenant.plan.charAt(0).toUpperCase() + tenant.plan.slice(1)}
                    </span>
                  </td>
                  <td className="px-2 py-1.5">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px]">{getStatusIcon(tenant.status)}</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(tenant.status)}`}>
                        {tenant.status.charAt(0).toUpperCase() + tenant.status.slice(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-2 py-1.5">
                    <div className="text-xs text-gray-900">{tenant.userCount}</div>
                    <div className="text-[10px] text-gray-500">{tenant.trucksCount} trucks</div>
                  </td>
                  <td className="px-2 py-1.5">
                    <div className="text-xs font-semibold text-gray-900">
                      ${tenant.revenue?.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-2 py-1.5">
                    <div className="text-xs text-gray-900">
                      {new Date(tenant.lastActivity).toLocaleDateString()}
                    </div>
                    <div className="text-[10px] text-gray-500">
                      {new Date(tenant.lastActivity).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="px-2 py-1.5">
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => {
                          setSelectedTenant(tenant);
                          setShowDetailsModal(true);
                        }}
                        className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        title="View Details"
                      >
                        <FaEye className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={() => handleEditTenant(tenant)}
                        className="p-1 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                        title="Edit"
                      >
                        <FaEdit className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={() => {
                          setSettingsTenantId(tenant.id);
                          setShowSettingsModal(true);
                        }}
                        className="p-1 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                        title="Settings"
                      >
                        <FaCog className="w-3 h-3" />
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

      {/* Create Tenant Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900">Create New Tenant</h2>
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
                    Tenant Name *
                  </label>
                  <input
                    type="text"
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    placeholder="Enter tenant name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Subdomain *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                      placeholder="Enter subdomain"
                      value={subdomain}
                      onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9.-]/g, '').replace(/\.{2,}/g, '.').replace(/^\.|\.$/g, ''))}
                    />
                    {!subdomain.includes('.') && (
                      <div className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                        .urutix.com
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Domain
                  </label>
                  <input
                    type="text"
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    placeholder="example.com"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    placeholder="admin@company.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Subscription Plan
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {['starter', 'professional', 'enterprise'].map((planOption) => (
                    <div
                      key={planOption}
                      className={`border-2 rounded-lg p-2 cursor-pointer transition-all ${
                        plan === planOption 
                          ? 'border-gray-500 bg-gray-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setPlan(planOption as 'starter' | 'professional' | 'enterprise')}
                    >
                      <div className="text-center">
                        <div className="font-semibold text-gray-900 capitalize text-xs">{planOption}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          {planOption === 'starter' && '$29/month'}
                          {planOption === 'professional' && '$99/month'}
                          {planOption === 'enterprise' && '$299/month'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-2">
                <div className="flex items-start gap-1.5">
                  <FaShieldAlt className="text-gray-600 mt-0.5 text-xs" />
                  <div>
                    <h4 className="font-semibold text-gray-900 text-xs">Security Notice</h4>
                    <p className="text-[10px] text-gray-700 mt-0.5">
                      A new tenant will be created with default security settings. The admin will receive setup instructions via email.
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
                onClick={handleCreateTenant}
                disabled={isCreating || !name || !subdomain || !contactEmail}
                className="px-2.5 py-1.5 text-xs bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 font-medium"
              >
                {isCreating && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                <span>{isCreating ? 'Creating...' : 'Create Tenant'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Tenant Modal */}
      {showEditModal && editingTenantId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900">Edit Tenant</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingTenantId(null);
                    resetEditForm();
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {isLoadingTenantDetails ? (
              <div className="p-3 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
                <span className="ml-2 text-xs text-gray-600">Loading tenant details...</span>
              </div>
            ) : (
              <div className="p-3 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Tenant Name *
                    </label>
                    <input
                      type="text"
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                      placeholder="Enter tenant name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Subdomain *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                        placeholder="Enter subdomain"
                        value={editSubdomain}
                        onChange={(e) => setEditSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9.-]/g, '').replace(/\.{2,}/g, '.').replace(/^\.|\.$/g, ''))}
                      />
                      {!editSubdomain.includes('.') && (
                        <div className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                          .urutix.com
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Domain
                    </label>
                    <input
                      type="text"
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                      placeholder="example.com"
                      value={editDomain}
                      onChange={(e) => setEditDomain(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Contact Email *
                    </label>
                    <input
                      type="email"
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                      placeholder="admin@company.com"
                      value={editContactEmail}
                      onChange={(e) => setEditContactEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                      placeholder="+1234567890"
                      value={editContactPhone}
                      onChange={(e) => setEditContactPhone(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Website URL
                    </label>
                    <input
                      type="url"
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                      placeholder="https://www.example.com"
                      value={editWebsiteUrl}
                      onChange={(e) => setEditWebsiteUrl(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    placeholder="Enter tenant description"
                    rows={3}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                      placeholder="123 Main Street"
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                      placeholder="New York"
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      State/Province
                    </label>
                    <input
                      type="text"
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                      placeholder="NY"
                      value={editState}
                      onChange={(e) => setEditState(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                      placeholder="USA"
                      value={editCountry}
                      onChange={(e) => setEditCountry(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                      placeholder="10001"
                      value={editPostalCode}
                      onChange={(e) => setEditPostalCode(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Subscription Plan
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {['starter', 'professional', 'enterprise'].map((planOption) => (
                      <div
                        key={planOption}
                        className={`border-2 rounded-lg p-2 cursor-pointer transition-all ${
                          editPlan === planOption 
                            ? 'border-gray-500 bg-gray-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setEditPlan(planOption as 'starter' | 'professional' | 'enterprise')}
                      >
                        <div className="text-center">
                          <div className="font-semibold text-gray-900 capitalize text-xs">{planOption}</div>
                          <div className="text-[10px] text-gray-500 mt-0.5">
                            {planOption === 'starter' && '$29/month'}
                            {planOption === 'professional' && '$99/month'}
                            {planOption === 'enterprise' && '$299/month'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="p-2.5 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingTenantId(null);
                  resetEditForm();
                }}
                className="px-2.5 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateTenant}
                disabled={isUpdating || isLoadingTenantDetails || !editName || !editSubdomain || !editContactEmail}
                className="px-2.5 py-1.5 text-xs bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 font-medium"
              >
                {isUpdating && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                <span>{isUpdating ? 'Updating...' : 'Update Tenant'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tenant Details Modal */}
      {showDetailsModal && selectedTenant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                    <FaBuilding className="text-white text-sm" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{selectedTenant.name}</h2>
                    <p className="text-xs text-gray-600">{selectedTenant.domain || selectedTenant.subdomain}</p>
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
              {/* Status and Plan */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center space-x-2 flex-wrap">
                  <div className="flex items-center space-x-1.5">
                    {getStatusIcon(selectedTenant.status)}
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(selectedTenant.status)}`}>
                      {selectedTenant.status.charAt(0).toUpperCase() + selectedTenant.status.slice(1)}
                    </span>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getPlanColor(selectedTenant.plan)}`}>
                    {selectedTenant.plan.charAt(0).toUpperCase() + selectedTenant.plan.slice(1)} Plan
                  </span>
                </div>
                <div className="flex space-x-1.5">
                  <button className="px-2.5 py-1.5 text-xs bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors">
                    Manage Access
                  </button>
                  <button className="px-2.5 py-1.5 text-xs border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                    View Logs
                  </button>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                  <div className="flex items-center space-x-2">
                    <FaUsers className="text-gray-600 text-xs" />
                    <div>
                      <div className="text-base font-bold text-gray-900">{selectedTenant.userCount || 0}</div>
                      <div className="text-[10px] text-gray-700">Total Users</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                  <div className="flex items-center space-x-2">
                    <FaTruck className="text-gray-600 text-xs" />
                    <div>
                      <div className="text-base font-bold text-gray-900">{selectedTenant.trucksCount || 0}</div>
                      <div className="text-[10px] text-gray-700">Active Trucks</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                  <div className="flex items-center space-x-2">
                    <FaChartLine className="text-gray-600 text-xs" />
                    <div>
                      <div className="text-base font-bold text-gray-900">${(selectedTenant.revenue || 0).toLocaleString()}</div>
                      <div className="text-[10px] text-gray-700">Monthly Revenue</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                  <div className="flex items-center space-x-2">
                    <FaCalendarAlt className="text-gray-600 text-xs" />
                    <div>
                      <div className="text-base font-bold text-gray-900">
                        {Math.ceil((new Date().getTime() - new Date(selectedTenant.createdAt).getTime()) / (1000 * 3600 * 24))}
                      </div>
                      <div className="text-[10px] text-gray-700">Days Active</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tenant Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-gray-900">Tenant Information</h3>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium">{new Date(selectedTenant.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Activity:</span>
                      <span className="font-medium">{selectedTenant.lastActivity ? new Date(selectedTenant.lastActivity).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Admin:</span>
                      <span className="font-medium">{selectedTenant.adminName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Contact:</span>
                      <span className="font-medium">{selectedTenant.contactEmail || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Location:</span>
                      <span className="font-medium">{selectedTenant.location || 'N/A'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-gray-900">Quick Actions</h3>
                  <div className="space-y-2">
                    <button 
                      onClick={() => {
                        setSettingsTenantId(selectedTenant.id);
                        setShowSettingsModal(true);
                      }}
                      className="w-full flex items-center space-x-2 p-2 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-xs"
                    >
                      <FaCog className="text-gray-400 w-3 h-3" />
                      <span>Tenant Settings</span>
                    </button>
                    <button 
                      onClick={() => {
                        setManageUsersTenantId(selectedTenant.id);
                        setManageUsersTenantName(selectedTenant.name);
                        setShowManageUsersModal(true);
                      }}
                      className="w-full flex items-center space-x-2 p-2 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-xs"
                    >
                      <FaUsers className="text-gray-400 w-3 h-3" />
                      <span>Manage Users</span>
                    </button>
                    <button className="w-full flex items-center space-x-2 p-2 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-xs">
                      <FaShieldAlt className="text-gray-400 w-3 h-3" />
                      <span>Security Settings</span>
                    </button>
                    <button className="w-full flex items-center space-x-2 p-2 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-600 text-xs">
                      <FaBan className="text-gray-400 w-3 h-3" />
                      <span>Suspend Tenant</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tenant Settings Modal */}
      {showSettingsModal && settingsTenantId && (
        <TenantSettingsModal
          tenantId={settingsTenantId}
          isOpen={showSettingsModal}
          onClose={() => {
            setShowSettingsModal(false);
            setSettingsTenantId(null);
          }}
        />
      )}

      {/* Manage Users Modal */}
      {showManageUsersModal && manageUsersTenantId && (
        <ManageUsersModal
          tenantId={manageUsersTenantId}
          tenantName={manageUsersTenantName}
          isOpen={showManageUsersModal}
          onClose={() => {
            setShowManageUsersModal(false);
            setManageUsersTenantId(null);
            setManageUsersTenantName('');
          }}
        />
      )}

    </div>
  );
};

export default AdminTenants;


