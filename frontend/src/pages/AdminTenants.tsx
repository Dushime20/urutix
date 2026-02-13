import React, { useState, useMemo, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createTenant, fetchTenants, getTenantById, updateTenant } from '../services/adminApi';
import toast from 'react-hot-toast';
import TenantSettingsModal from '../components/TenantSettingsModal';
import ManageUsersModal from '../components/ManageUsersModal';
import TenantKYCModal from '../components/TenantKYCModal';
import {
  FaBuilding, FaEdit, FaPlus, FaSearch, FaDownload,
  FaEye, FaCheck, FaTimes, FaBan,
  FaSort, FaGlobe, FaUsers, FaChartLine,
  FaCalendarAlt, FaCog, FaShieldAlt, FaExclamationTriangle,
  FaTruck, FaCreditCard, FaClock
} from 'react-icons/fa';
import AdminPageLayout from '../components/Admin/AdminPageLayout';

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
  kycStatus?: 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'INCOMPLETE';
  kycData?: any;
}

const AdminTenants: React.FC = () => {
  const qc = useQueryClient();
  const navigate = useNavigate();

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
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [kycTenant, setKYCTenant] = useState<Tenant | null>(null);

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
    // Backend returns { success: true, data: [...tenants], message: "..." }
    // Check multiple possible response structures
    let tenantsArray: any[] = [];

    if (tenantsData?.data && Array.isArray(tenantsData.data)) {
      tenantsArray = tenantsData.data;
    } else if (tenantsData?.tenants && Array.isArray(tenantsData.tenants)) {
      tenantsArray = tenantsData.tenants;
    } else if (Array.isArray(tenantsData)) {
      tenantsArray = tenantsData;
    }

    if (!tenantsArray || tenantsArray.length === 0) {
      console.log('⚠️ No tenants found in response:', tenantsData);
      return [];
    }

    console.log(`✅ Found ${tenantsArray.length} tenants to display`);

    const transformed = tenantsArray.map((tenant: any) => {
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
        kycStatus: tenant.kycStatus || 'PENDING',
        kycData: tenant.kycData || {},
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
    mutationFn: async (payload: any) => {
      console.log('🔄 Updating tenant:', editingTenantId, 'with payload:', payload);
      try {
        const result = await updateTenant(editingTenantId!, payload);
        console.log('✅ Update successful:', result);
        return result;
      } catch (error: any) {
        console.error('❌ Update failed:', error);
        console.error('Error response:', error?.response);
        console.error('Error data:', error?.response?.data);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('✅ Update mutation success, invalidating queries');
      qc.invalidateQueries({ queryKey: ['admin-tenants'] });
      qc.invalidateQueries({ queryKey: ['tenant-details', editingTenantId] });
      setShowEditModal(false);
      setEditingTenantId(null);
      resetEditForm();
      toast.success('Tenant updated successfully!');
    },
    onError: (error: any) => {
      console.error('❌ Update mutation error:', error);
      const errorMessage = error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to update tenant. Please try again.';
      console.error('Error message shown to user:', errorMessage);
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
    // Validation
    if (!editName.trim()) {
      toast.error('Tenant name is required');
      return;
    }
    if (!editSubdomain.trim()) {
      toast.error('Subdomain is required');
      return;
    }
    if (!editContactEmail.trim()) {
      toast.error('Contact email is required');
      return;
    }

    console.log('📝 Preparing tenant update...');
    console.log('Tenant ID:', editingTenantId);
    console.log('User from localStorage:', localStorage.getItem('user'));
    console.log('Token from localStorage:', localStorage.getItem('accessToken') ? 'Present' : 'Missing');
    
    const payload = {
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
      subscriptionPlan: editPlan.toUpperCase(), // Backend expects uppercase
    };

    console.log('📤 Sending payload:', payload);
    updateTenantMutation(payload);
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

  const getKYCStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-700';
      case 'REJECTED': return 'bg-red-100 text-red-700';
      case 'SUBMITTED': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-600';
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
    <AdminPageLayout
      title="Tenant Management"
      description="Manage platform tenants and their configurations"
      actions={
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-all duration-200 shadow-sm text-sm font-bold"
        >
          <FaPlus size={14} />
          <span>Add Tenant</span>
        </button>
      }
    >

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
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        {isLoadingTenants ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-sm text-gray-600">Loading tenants...</span>
          </div>
        ) : tenantsError ? (
          <div className="p-8 text-center">
            <div className="text-red-600 mb-3">
              <FaExclamationTriangle className="text-3xl mx-auto mb-3" />
              <p className="text-base font-semibold">Failed to load tenants</p>
              {tenantsError instanceof Error && (
                <p className="text-sm text-gray-600 mt-2">{tenantsError.message}</p>
              )}
            </div>
          </div>
        ) : filteredTenants.length === 0 ? (
          <div className="p-12 text-center">
            <FaBuilding className="text-5xl text-gray-300 mx-auto mb-4" />
            <p className="text-base text-gray-600 font-medium">No tenants found</p>
            {searchTerm || statusFilter !== 'all' || planFilter !== 'all' ? (
              <p className="text-sm text-gray-500 mt-2">Try adjusting your filters</p>
            ) : null}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                <tr>
                  <th className="px-4 py-4 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">
                    <button
                      className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                      onClick={() => {
                        setSortBy('name');
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      }}
                    >
                      <span>Tenant</span>
                      <FaSort className="w-3.5 h-3.5" />
                    </button>
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">Domain</th>
                  <th className="px-4 py-4 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">Plan</th>
                  <th className="px-4 py-4 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-4 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">KYC</th>
                  <th className="px-4 py-4 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">Users</th>
                  <th className="px-4 py-4 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">Revenue</th>
                  <th className="px-4 py-4 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">Last Activity</th>
                  <th className="px-4 py-4 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredTenants.map((tenant: Tenant) => (
                  <tr key={tenant.id} className="hover:bg-blue-50 transition-colors cursor-pointer">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                          <FaBuilding className="text-white text-lg" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-gray-900 text-base truncate">{tenant.name}</div>
                          <div className="text-sm text-gray-600">{tenant.adminName || 'No admin assigned'}</div>
                          {tenant.location && (
                            <div className="text-xs text-gray-500 mt-0.5">{tenant.location}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <FaGlobe className="text-blue-500 text-base flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-gray-900 truncate">{tenant.domain || tenant.subdomain}</div>
                          <div className="text-xs text-gray-500 truncate">{tenant.contactEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-3 py-1.5 rounded-full text-sm font-bold ${getPlanColor(tenant.plan)}`}>
                        {tenant.plan.charAt(0).toUpperCase() + tenant.plan.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{getStatusIcon(tenant.status)}</span>
                        <span className={`inline-flex px-3 py-1.5 rounded-full text-sm font-bold ${getStatusColor(tenant.status)}`}>
                          {tenant.status.charAt(0).toUpperCase() + tenant.status.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex px-3 py-1.5 rounded-full text-sm font-bold cursor-pointer hover:opacity-80 transition-opacity ${getKYCStatusColor(tenant.kycStatus || 'PENDING')}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setKYCTenant(tenant);
                          setShowKYCModal(true);
                        }}
                      >
                        {tenant.kycStatus || 'PENDING'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-base font-bold text-gray-900">{tenant.userCount || 0}</div>
                      <div className="text-sm text-gray-600 flex items-center gap-1">
                        <FaTruck className="w-3 h-3" />
                        {tenant.trucksCount || 0} trucks
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-base font-bold text-green-600">
                        ${tenant.revenue?.toLocaleString() || '0'}
                      </div>
                      <div className="text-xs text-gray-500">monthly</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(tenant.lastActivity).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(tenant.lastActivity).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTenant(tenant);
                            setShowDetailsModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <FaEye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTenant(tenant);
                          }}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSettingsTenantId(tenant.id);
                            setShowSettingsModal(true);
                          }}
                          className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                          title="Settings"
                        >
                          <FaCog className="w-4 h-4" />
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
                      className={`border-2 rounded-lg p-2 cursor-pointer transition-all ${plan === planOption
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
                        className={`border-2 rounded-lg p-2 cursor-pointer transition-all ${editPlan === planOption
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
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <FaBuilding className="text-white text-2xl" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedTenant.name}</h2>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-blue-100 text-sm flex items-center gap-1">
                        <FaGlobe className="w-3 h-3" />
                        {selectedTenant.domain || selectedTenant.subdomain}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        selectedTenant.status === 'active' 
                          ? 'bg-green-500/20 text-green-100 border border-green-400/30' 
                          : 'bg-yellow-500/20 text-yellow-100 border border-yellow-400/30'
                      }`}>
                        {selectedTenant.status.toUpperCase()}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white border border-white/30">
                        {selectedTenant.plan.toUpperCase()} PLAN
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <FaUsers className="text-white text-lg" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{selectedTenant.userCount || 0}</div>
                  <div className="text-sm text-gray-600">Total Users</div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                      <FaTruck className="text-white text-lg" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{selectedTenant.trucksCount || 0}</div>
                  <div className="text-sm text-gray-600">Active Trucks</div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                      <FaChartLine className="text-white text-lg" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">${(selectedTenant.revenue || 0).toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Monthly Revenue</div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                      <FaCalendarAlt className="text-white text-lg" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {Math.ceil((new Date().getTime() - new Date(selectedTenant.createdAt).getTime()) / (1000 * 3600 * 24))}
                  </div>
                  <div className="text-sm text-gray-600">Days Active</div>
                </div>
              </div>

              {/* Information Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FaBuilding className="text-blue-600" />
                    Basic Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600 font-medium">Tenant ID</span>
                      <span className="text-sm text-gray-900 font-mono">{selectedTenant.id}</span>
                    </div>
                    <div className="flex items-start justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600 font-medium">Subdomain</span>
                      <span className="text-sm text-blue-600 font-medium">{selectedTenant.subdomain}</span>
                    </div>
                    <div className="flex items-start justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600 font-medium">Domain</span>
                      <span className="text-sm text-gray-900">{selectedTenant.domain || 'Not set'}</span>
                    </div>
                    <div className="flex items-start justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600 font-medium">Created</span>
                      <span className="text-sm text-gray-900">{new Date(selectedTenant.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-start justify-between py-2">
                      <span className="text-sm text-gray-600 font-medium">Last Activity</span>
                      <span className="text-sm text-gray-900">
                        {selectedTenant.lastActivity 
                          ? new Date(selectedTenant.lastActivity).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                          : 'No activity'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FaUsers className="text-green-600" />
                    Contact Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600 font-medium">Admin Name</span>
                      <span className="text-sm text-gray-900">{selectedTenant.adminName || 'Not assigned'}</span>
                    </div>
                    <div className="flex items-start justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600 font-medium">Email</span>
                      <span className="text-sm text-blue-600">{selectedTenant.contactEmail || 'Not set'}</span>
                    </div>
                    <div className="flex items-start justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600 font-medium">Location</span>
                      <span className="text-sm text-gray-900">{selectedTenant.location || 'Not set'}</span>
                    </div>
                    <div className="flex items-start justify-between py-2">
                      <span className="text-sm text-gray-600 font-medium">KYC Status</span>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getKYCStatusColor(selectedTenant.kycStatus || 'PENDING')}`}>
                        {selectedTenant.kycStatus || 'PENDING'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subscription Details Section */}
              <TenantSubscriptionDetails tenantId={selectedTenant.id} />

              {/* Quick Actions */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FaCog className="text-purple-600" />
                  Quick Actions
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button
                    onClick={() => {
                      handleEditTenant(selectedTenant);
                      setShowDetailsModal(false);
                    }}
                    className="flex flex-col items-center justify-center p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
                  >
                    <FaEdit className="text-2xl text-gray-400 group-hover:text-blue-600 mb-2" />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">Edit Tenant</span>
                  </button>

                  <button
                    onClick={() => {
                      setSettingsTenantId(selectedTenant.id);
                      setShowSettingsModal(true);
                      setShowDetailsModal(false);
                    }}
                    className="flex flex-col items-center justify-center p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all group"
                  >
                    <FaCog className="text-2xl text-gray-400 group-hover:text-purple-600 mb-2" />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-purple-600">Settings</span>
                  </button>

                  <button
                    onClick={() => {
                      setManageUsersTenantId(selectedTenant.id);
                      setManageUsersTenantName(selectedTenant.name);
                      setShowManageUsersModal(true);
                      setShowDetailsModal(false);
                    }}
                    className="flex flex-col items-center justify-center p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all group"
                  >
                    <FaUsers className="text-2xl text-gray-400 group-hover:text-green-600 mb-2" />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-green-600">Manage Users</span>
                  </button>

                  <button
                    onClick={() => {
                      setKYCTenant(selectedTenant);
                      setShowKYCModal(true);
                      setShowDetailsModal(false);
                    }}
                    className="flex flex-col items-center justify-center p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all group"
                  >
                    <FaShieldAlt className="text-2xl text-gray-400 group-hover:text-orange-600 mb-2" />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-orange-600">KYC Status</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-6 py-2.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Close
                </button>
                <div className="flex gap-3">
                  <button className="px-6 py-2.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2">
                    <FaDownload className="w-4 h-4" />
                    Export Data
                  </button>
                  <button 
                    onClick={() => {
                      if (selectedTenant) {
                        setShowDetailsModal(false);
                        navigate('/admin/activity-logs', { 
                          state: { 
                            filterTenantId: selectedTenant.id,
                            filterTenantName: selectedTenant.name 
                          } 
                        });
                      }
                    }}
                    className="px-6 py-2.5 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-medium"
                  >
                    View Logs
                  </button>
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

      {/* KYC Modal */}
      {showKYCModal && kycTenant && (
        <TenantKYCModal
          tenantId={kycTenant.id}
          tenantName={kycTenant.name}
          currentStatus={kycTenant.kycStatus || 'PENDING'}
          kycData={kycTenant.kycData}
          isOpen={showKYCModal}
          onClose={() => {
            setShowKYCModal(false);
            setKYCTenant(null);
          }}
        />
      )}
    </AdminPageLayout>
  );
};

// Tenant Subscription Details Component
const TenantSubscriptionDetails: React.FC<{ tenantId: string }> = ({ tenantId }) => {
  const navigate = useNavigate();

  // Fetch tenant subscription
  const { data: subscriptionData, isLoading } = useQuery({
    queryKey: ['tenant-subscription', tenantId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/admin/tenants/${tenantId}/subscription`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          if (response.status === 404) {
            return null; // No subscription found
          }
          throw new Error('Failed to fetch subscription');
        }
        const data = await response.json();
        return data.data;
      } catch (error) {
        console.error('Error fetching subscription:', error);
        return null;
      }
    },
  });

  const subscription = subscriptionData;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'trial':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'expired':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'suspended':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FaCreditCard className="text-purple-600" />
          Subscription Details
        </h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FaCreditCard className="text-purple-600" />
          Subscription Details
        </h3>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <FaExclamationTriangle className="text-gray-400 text-2xl" />
          </div>
          <p className="text-gray-600 text-sm">No active subscription found</p>
          <button
            onClick={() => navigate('/admin/subscriptions')}
            className="mt-4 px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Manage Subscriptions
          </button>
        </div>
      </div>
    );
  }

  const isTrial = subscription.status === 'trial';
  const currentPrice = Number(subscription.billingCycle === 'monthly' 
    ? (subscription.plan.priceMonthly || subscription.plan.price_monthly || 0)
    : (subscription.plan.priceYearly || subscription.plan.price_yearly || 0));

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <FaCreditCard className="text-purple-600" />
          Subscription Details
        </h3>
        <button
          onClick={() => navigate('/admin/subscriptions')}
          className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
        >
          <FaCog className="w-3 h-3" />
          Manage
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Column */}
        <div className="space-y-3">
          <div className="flex items-start justify-between py-2 border-b border-purple-100">
            <span className="text-sm text-gray-600 font-medium">Plan</span>
            <span className="text-sm text-gray-900 font-bold">{subscription.plan.name}</span>
          </div>
          <div className="flex items-start justify-between py-2 border-b border-purple-100">
            <span className="text-sm text-gray-600 font-medium">Status</span>
            <span className={`text-xs px-2 py-1 rounded-full font-medium border ${getStatusColor(subscription.status)}`}>
              {subscription.status.toUpperCase()}
            </span>
          </div>
          <div className="flex items-start justify-between py-2 border-b border-purple-100">
            <span className="text-sm text-gray-600 font-medium">Billing Cycle</span>
            <span className="text-sm text-gray-900 capitalize">{subscription.billingCycle}</span>
          </div>
          <div className="flex items-start justify-between py-2">
            <span className="text-sm text-gray-600 font-medium">Price</span>
            <span className="text-sm text-gray-900 font-bold">
              ${currentPrice.toFixed(2)}/{subscription.billingCycle === 'monthly' ? 'mo' : 'yr'}
            </span>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-3">
          <div className="flex items-start justify-between py-2 border-b border-purple-100">
            <span className="text-sm text-gray-600 font-medium">Credit Balance</span>
            <span className="text-sm font-bold text-purple-600">{subscription.creditBalance || 0} credits</span>
          </div>
          <div className="flex items-start justify-between py-2 border-b border-purple-100">
            <span className="text-sm text-gray-600 font-medium">Period Start</span>
            <span className="text-sm text-gray-900">
              {new Date(subscription.currentPeriodStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <div className="flex items-start justify-between py-2 border-b border-purple-100">
            <span className="text-sm text-gray-600 font-medium">Period End</span>
            <span className="text-sm text-gray-900">
              {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <div className="flex items-start justify-between py-2">
            <span className="text-sm text-gray-600 font-medium">Auto-Renew</span>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              subscription.autoRenew 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-gray-100 text-gray-800 border border-gray-200'
            }`}>
              {subscription.autoRenew ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>
      </div>

      {/* Trial Banner */}
      {isTrial && subscription.trialEnd && (
        <div className="mt-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg p-3">
          <div className="flex items-center gap-2">
            <FaClock className="text-lg" />
            <div>
              <p className="text-sm font-bold">Trial Period</p>
              <p className="text-xs opacity-90">
                Ends on {new Date(subscription.trialEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-purple-200">
          <div className="text-xs text-gray-600 mb-1">Included Credits</div>
          <div className="text-lg font-bold text-purple-600">{subscription.plan.includedCredits}</div>
        </div>
        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-purple-200">
          <div className="text-xs text-gray-600 mb-1">Total Revenue</div>
          <div className="text-lg font-bold text-green-600">${(subscription.totalRevenue || 0).toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
};

export default AdminTenants;