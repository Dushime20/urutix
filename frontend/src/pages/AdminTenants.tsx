import React, { useState, useMemo, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  createTenant, 
  fetchTenants, 
  fetchEnrichedTenants,
  getTenantById, 
  getTenantDetailsEnriched,
  getTenantHealth,
  updateTenant,
  setTenantStatus,
  bulkUpdateTenants
} from '../services/adminApi';
import toast from 'react-hot-toast';
import TenantSettingsModal from '../components/TenantSettingsModal';
import ManageUsersModal from '../components/ManageUsersModal';
import TenantKYCModal from '../components/TenantKYCModal';
import {
  Building2, Edit, Plus, Search, Download,
  Eye, Check, X,
  ChevronsUpDown, Globe, Users, TrendingUp,
  Calendar, Settings, ShieldCheck, AlertTriangle,
  Truck, CreditCard, Clock, Activity, Heart
} from 'lucide-react';
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
  // Enhanced fields from new API
  healthScore?: number;
  subscription?: {
    planName: string;
    status: string;
    expiresAt: Date;
  };
  credits?: {
    balance: number;
    lastPurchase: Date;
  };
  users?: {
    total: number;
    active: number;
  };
}

const AdminTenants: React.FC = () => {
  const qc = useQueryClient();
  const navigate = useNavigate();

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

  // Toggle between basic and enriched data
  const [useEnrichedData, setUseEnrichedData] = useState(true);

  // Fetch tenants from API - use enriched data when enabled
  const { data: tenantsData, isLoading: isLoadingTenants, error: tenantsError } = useQuery({
    queryKey: ['admin-tenants', useEnrichedData, statusFilter, searchTerm],
    queryFn: async () => {
      try {
        if (useEnrichedData) {
          // Use new enriched API
          const filters: any = {};
          if (statusFilter !== 'all') {
            filters.status = [statusFilter.toUpperCase()];
          }
          if (searchTerm) {
            filters.search = searchTerm;
          }
          const result = await fetchEnrichedTenants(filters);
          return result;
        } else {
          // Use legacy API
          const result = await fetchTenants();
          return result;
        }
      } catch (error: any) {
        console.error("Error fetching tenants:", error);
        throw error;
      }
    }
  });

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
      // Check if this is enriched data (has subscription, credits, users objects)
      const isEnriched = tenant.subscription || tenant.credits || tenant.users;
      
      const mapped: Tenant = {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain || '',
        status: mapBackendStatus(tenant.status || 'PENDING_ACTIVATION'),
        createdAt: tenant.createdAt ? new Date(tenant.createdAt).toISOString() : new Date().toISOString(),
        lastActivity: tenant.lastActivity ? new Date(tenant.lastActivity).toISOString() : 
                      tenant.updatedAt ? new Date(tenant.updatedAt).toISOString() : 
                      tenant.createdAt ? new Date(tenant.createdAt).toISOString() : 
                      new Date().toISOString(),
        userCount: isEnriched ? tenant.users?.total : 0,
        trucksCount: 0, // Will be populated from relations if available
        revenue: 0, // Will be calculated from billing data if available
        plan: isEnriched && tenant.subscription?.planName ? 
              mapBackendPlan(tenant.subscription.planName) : 
              mapBackendPlan(tenant.subscriptionPlan),
        domain: tenant.domain || '',
        contactEmail: tenant.contactEmail || '',
        adminName: '', // Will be populated from admin user relation if available
        location: tenant.city && tenant.country ? `${tenant.city}, ${tenant.country}` : tenant.country || tenant.city || '',
        kycStatus: tenant.kycStatus || 'PENDING',
        kycData: tenant.kycData || {},
        // Enhanced fields
        healthScore: tenant.healthScore,
        subscription: tenant.subscription,
        credits: tenant.credits,
        users: tenant.users,
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
    onSuccess: () => {
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

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'starter': return 'bg-gray-100 text-gray-700';
      case 'professional': return 'bg-gray-100 text-gray-700';
      case 'enterprise': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getKYCStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'REJECTED': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'SUBMITTED': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  const getHealthScoreColor = (score?: number) => {
    if (!score) return { bg: 'bg-gray-100', text: 'text-gray-600', label: 'N/A' };
    if (score >= 80) return { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'EXCELLENT' };
    if (score >= 60) return { bg: 'bg-green-100', text: 'text-green-700', label: 'GOOD' };
    if (score >= 40) return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'FAIR' };
    if (score >= 20) return { bg: 'bg-orange-100', text: 'text-orange-700', label: 'POOR' };
    return { bg: 'bg-rose-100', text: 'text-rose-700', label: 'CRITICAL' };
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
    { label: 'Total Tenants', value: tenants.length, icon: Building2, color: 'from-gray-600 to-gray-700' },
    { label: 'Active Tenants', value: tenants.filter((t: Tenant) => t.status === 'active').length, icon: Check, color: 'from-gray-600 to-gray-700' },
    { label: 'Total Users', value: tenants.reduce((sum: number, t: Tenant) => sum + (t.userCount || 0), 0), icon: Users, color: 'from-gray-600 to-gray-700' },
    { label: 'Total Revenue', value: `$${tenants.reduce((sum: number, t: Tenant) => sum + (t.revenue || 0), 0).toLocaleString()}`, icon: TrendingUp, color: 'from-gray-600 to-gray-700' },
  ];

  return (
    <AdminPageLayout
      title="Tenant Management"
      description="Manage platform tenants and their configurations"
      actions={
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-all duration-200 text-sm font-bold"
        >
          <Plus size={16} />
          <span>Add Tenant</span>
        </button>
      }
    >

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-500">
                <Icon size={100} className="text-gray-900" />
              </div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all duration-300 shadow-sm">
                    <Icon size={18} />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{stat.label}</p>
                </div>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-black text-gray-900 leading-none tracking-tight">{stat.value}</h3>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4 leading-none">Global platform metric</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters and Search */}
      <div className="p-6 border-b border-gray-100 bg-[#fafafa] rounded-xl border mb-10 flex flex-col md:flex-row gap-6 items-center justify-between">
        <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <div className="relative group">
            <input
              type="text"
              placeholder="SEARCH TENANTS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 text-[10px] font-black uppercase tracking-widest border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-full md:w-64 bg-white transition-all shadow-sm"
            />
            <Search className="absolute left-3.5 top-3 text-slate-400 group-hover:text-indigo-500 transition-colors w-3.5 h-3.5" />
          </div>

          <select
            className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white shadow-sm cursor-pointer hover:border-indigo-200 transition-all font-black"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">ALL STATUS</option>
            <option value="active">ACTIVE</option>
            <option value="inactive">INACTIVE</option>
            <option value="pending">PENDING</option>
            <option value="suspended">SUSPENDED</option>
          </select>

          <select
            className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white shadow-sm cursor-pointer hover:border-indigo-200 transition-all font-black"
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
          >
            <option value="all">ALL PLANS</option>
            <option value="starter">STARTER</option>
            <option value="professional">PROFESSIONAL</option>
            <option value="enterprise">ENTERPRISE</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setUseEnrichedData(!useEnrichedData)}
            className={`px-4 py-2.5 text-[10px] font-black uppercase tracking-widest border rounded-xl flex items-center gap-2 transition-all shadow-sm ${
              useEnrichedData 
                ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700' 
                : 'bg-white text-slate-600 border-gray-200 hover:bg-gray-50'
            }`}
            title={useEnrichedData ? 'Showing enriched data with health scores' : 'Showing basic data'}
          >
            <Heart className="w-3 h-3" /> 
            {useEnrichedData ? 'Enhanced View' : 'Basic View'}
          </button>
          <button className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest border border-gray-200 rounded-xl flex items-center gap-2 hover:bg-gray-50 bg-white transition-all shadow-sm text-slate-600">
            <Download className="w-3 h-3" /> Export
          </button>
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-gray-100/50 px-4 py-2.5 rounded-xl border border-gray-100">
            {filteredTenants.length} IDENTIFIED
          </div>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="bg-white rounded-xl overflow-hidden border border-gray-200">
        {isLoadingTenants ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-sm text-gray-600">Loading tenants...</span>
          </div>
        ) : tenantsError ? (
          <div className="p-8 text-center">
            <div className="text-red-600 mb-3">
              <AlertTriangle className="text-3xl mx-auto mb-3" />
              <p className="text-base font-semibold">Failed to load tenants</p>
              {tenantsError instanceof Error && (
                <p className="text-sm text-gray-600 mt-2">{tenantsError.message}</p>
              )}
            </div>
          </div>
        ) : filteredTenants.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="text-5xl text-gray-300 mx-auto mb-4" />
            <p className="text-base text-gray-600 font-medium">No tenants found</p>
            {searchTerm || statusFilter !== 'all' || planFilter !== 'all' ? (
              <p className="text-sm text-gray-500 mt-2">Try adjusting your filters</p>
            ) : null}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#fafafa] border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">
                    <button
                      className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-gray-900 transition-colors"
                      onClick={() => {
                        setSortBy('name');
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      }}
                    >
                      <span>Tenant Identity</span>
                      <ChevronsUpDown className="w-3 h-3 text-gray-400" />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Network Node</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Access Plan</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  {useEnrichedData && (
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Health</th>
                  )}
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">KYC Sync</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Capacity</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fiscal Yield</th>
                  <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredTenants.map((tenant: Tenant) => (
                  <tr key={tenant.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-lg overflow-hidden relative group-hover:scale-105 transition-transform duration-300 bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-indigo-200">
                          <Building2 className="relative z-10 text-white" size={18} />
                          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div>
                          <div className="text-sm font-black text-gray-900 tracking-tight leading-tight uppercase">{tenant.name}</div>
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-1.5 leading-none">
                            <Users className="w-3 h-3 text-indigo-400" />
                            {tenant.adminName || 'NO ADMIN'}
                          </div>
                          {tenant.location && (
                            <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-0.5">{tenant.location}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-sm font-black text-gray-900 tracking-tight leading-none uppercase">
                          <Globe className="w-3 h-3 text-indigo-400" />
                          {tenant.domain || tenant.subdomain}
                        </div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                          {tenant.contactEmail}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border transition-all ${getPlanColor(tenant.plan).replace('bg-', 'bg-').replace('text-', 'text-').replace('100', '50/50').replace('700', '600')} border-indigo-100 shadow-sm`}>
                        {tenant.plan}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-2 h-2 rounded-full shadow-sm ${tenant.status === 'active' ? 'bg-emerald-500 shadow-emerald-200' : 'bg-rose-500 shadow-rose-200'}`}></div>
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none">{(tenant.status || '').replace('_', ' ')}</span>
                      </div>
                    </td>
                    {useEnrichedData && (
                      <td className="px-6 py-5">
                        {tenant.healthScore !== undefined ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Heart className={`w-3 h-3 ${getHealthScoreColor(tenant.healthScore).text}`} />
                              <span className="text-sm font-black text-gray-900 tracking-tight leading-none">{tenant.healthScore}</span>
                            </div>
                            <span className={`inline-flex px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${getHealthScoreColor(tenant.healthScore).bg} ${getHealthScoreColor(tenant.healthScore).text}`}>
                              {getHealthScoreColor(tenant.healthScore).label}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">N/A</span>
                        )}
                      </td>
                    )}
                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border transition-all cursor-pointer hover:scale-105 ${getKYCStatusColor(tenant.kycStatus || 'PENDING').replace('bg-', 'bg-').replace('text-', 'text-').replace('100', '50/50')} border-transparent shadow-sm`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setKYCTenant(tenant);
                          setShowKYCModal(true);
                        }}
                      >
                        {tenant.kycStatus || 'PENDING'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <div className="text-sm font-black text-gray-900 tracking-tight leading-none uppercase">
                          {useEnrichedData && tenant.users ? tenant.users.total : tenant.userCount || 0} SEATS
                        </div>
                        {useEnrichedData && tenant.users && (
                          <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5 leading-none">
                            <Activity size={10} className="text-emerald-500" />
                            {tenant.users.active} ACTIVE
                          </div>
                        )}
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 leading-none">
                          <Truck size={10} className="text-indigo-400" />
                          {tenant.trucksCount || 0} ASSETS
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        {useEnrichedData && tenant.credits ? (
                          <>
                            <div className="text-sm font-black text-indigo-600 tracking-tight leading-none uppercase flex items-center gap-1.5">
                              <CreditCard size={12} className="text-indigo-500" />
                              {tenant.credits.balance.toLocaleString()} CREDITS
                            </div>
                            {tenant.credits.lastPurchase && (
                              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 leading-none">
                                <Clock size={10} className="text-slate-300" />
                                {new Date(tenant.credits.lastPurchase).toLocaleDateString()}
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="text-sm font-black text-emerald-600 tracking-tight leading-none uppercase">${tenant.revenue?.toLocaleString() || '0'} USD</div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 leading-none">MONTHLY YIELD</div>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTenant(tenant);
                            setShowDetailsModal(true);
                          }}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all shadow-sm bg-white border border-gray-100"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTenant(tenant);
                          }}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all shadow-sm bg-white border border-gray-100"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSettingsTenantId(tenant.id);
                            setShowSettingsModal(true);
                          }}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all shadow-sm bg-white border border-gray-100"
                          title="Settings"
                        >
                          <Settings className="w-4 h-4" />
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
        <div className="fixed inset-0 bg-[#0a0a0b]/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-white/20">
            <div className="p-8 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-gray-900 tracking-tight uppercase">Initialize New Node</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Tenant Onboarding Sequence</p>
                </div>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Tenant Identity *
                  </label>
                  <input
                    type="text"
                    className="w-full px-5 py-3 text-sm font-black text-gray-900 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-300 placeholder:font-normal uppercase tracking-tight"
                    placeholder="ENTER TENANT NAME"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Network Subdomain *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full px-5 py-3 text-sm font-black text-indigo-600 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-300 placeholder:font-normal lowercase tracking-tight"
                      placeholder="subdomain"
                      value={subdomain}
                      onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9.-]/g, '').replace(/\.{2,}/g, '.').replace(/^\.|\.$/g, ''))}
                    />
                    {!subdomain.includes('.') && (
                      <div className="absolute right-5 top-1/2 transform -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase tracking-widest pointer-events-none">
                        .urutix.com
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Custom Domain
                  </label>
                  <input
                    type="text"
                    className="w-full px-5 py-3 text-sm font-black text-gray-900 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-300 placeholder:font-normal uppercase tracking-tight"
                    placeholder="EXAMPLE.COM"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Registry Email *
                  </label>
                  <input
                    type="email"
                    className="w-full px-5 py-3 text-sm font-black text-gray-900 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-300 placeholder:font-normal lowercase tracking-tight"
                    placeholder="admin@company.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                  Access Allocation Plan
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['starter', 'professional', 'enterprise'].map((planOption) => (
                    <div
                      key={planOption}
                      className={`group border rounded-[24px] p-6 cursor-pointer transition-all ${plan === planOption
                        ? 'border-indigo-600 bg-indigo-50/30'
                        : 'border-gray-100 hover:border-indigo-200 hover:bg-gray-50'
                        }`}
                      onClick={() => setPlan(planOption as 'starter' | 'professional' | 'enterprise')}
                    >
                      <div className="text-center">
                        <div className={`font-black uppercase text-xs tracking-widest mb-2 ${plan === planOption ? 'text-indigo-600' : 'text-gray-900'}`}>{planOption}</div>
                        <div className="text-sm font-black text-slate-400 group-hover:text-indigo-600/50 transition-colors">
                          {planOption === 'starter' && '$29/MO'}
                          {planOption === 'professional' && '$99/MO'}
                          {planOption === 'enterprise' && '$299/MO'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#fafafa] border border-gray-100 rounded-[24px] p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-indigo-600 border border-gray-50">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Protocol Intelligence</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 leading-relaxed">
                      Initializing this node will trigger automated environment configuration and registry notification.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-gray-100 flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="px-8 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all"
              >
                ABORT INIT
              </button>
              <button
                onClick={handleCreateTenant}
                disabled={isCreating || !name || !subdomain || !contactEmail}
                className="px-8 py-3 text-[10px] font-black bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all uppercase tracking-widest shadow-lg shadow-indigo-200 flex items-center gap-3"
              >
                {isCreating && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                <span>{isCreating ? 'PROCESSING...' : 'INITIALIZE NODE'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Tenant Modal */}
      {showEditModal && editingTenantId && (
        <div className="fixed inset-0 bg-[#0a0a0b]/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-white/20">
            <div className="p-8 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-gray-900 tracking-tight uppercase">Modify Active Node</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Tenant Configuration Sequence</p>
                </div>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingTenantId(null);
                    resetEditForm();
                  }}
                  className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {isLoadingTenantDetails ? (
              <div className="p-20 flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hydrating Protocol Data...</span>
              </div>
            ) : (
              <div className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Tenant Identity *
                    </label>
                    <input
                      type="text"
                      className="w-full px-5 py-3 text-sm font-black text-gray-900 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-300 placeholder:font-normal uppercase tracking-tight"
                      placeholder="ENTER TENANT NAME"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Network Subdomain *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full px-5 py-3 text-sm font-black text-indigo-600 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-300 placeholder:font-normal lowercase tracking-tight"
                        placeholder="subdomain"
                        value={editSubdomain}
                        onChange={(e) => setEditSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9.-]/g, '').replace(/\.{2,}/g, '.').replace(/^\.|\.$/g, ''))}
                      />
                      {!editSubdomain.includes('.') && (
                        <div className="absolute right-5 top-1/2 transform -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase tracking-widest pointer-events-none">
                          .urutix.com
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Custom Domain
                    </label>
                    <input
                      type="text"
                      className="w-full px-5 py-3 text-sm font-black text-gray-900 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-300 placeholder:font-normal uppercase tracking-tight"
                      placeholder="EXAMPLE.COM"
                      value={editDomain}
                      onChange={(e) => setEditDomain(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Registry Email *
                    </label>
                    <input
                      type="email"
                      className="w-full px-5 py-3 text-sm font-black text-gray-900 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-300 placeholder:font-normal lowercase tracking-tight"
                      placeholder="admin@company.com"
                      value={editContactEmail}
                      onChange={(e) => setEditContactEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Operational Contact
                    </label>
                    <input
                      type="tel"
                      className="w-full px-5 py-3 text-sm font-black text-gray-900 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-300 placeholder:font-normal tracking-tight"
                      placeholder="+1234567890"
                      value={editContactPhone}
                      onChange={(e) => setEditContactPhone(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Web Presence
                    </label>
                    <input
                      type="url"
                      className="w-full px-5 py-3 text-sm font-black text-indigo-600 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-300 placeholder:font-normal lowercase tracking-tight"
                      placeholder="https://www.example.com"
                      value={editWebsiteUrl}
                      onChange={(e) => setEditWebsiteUrl(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Node Narrative
                  </label>
                  <textarea
                    className="w-full px-5 py-3 text-sm font-black text-gray-900 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-300 placeholder:font-normal tracking-tight"
                    placeholder="ENTER TENANT DESCRIPTION"
                    rows={3}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Physical Base
                    </label>
                    <input
                      type="text"
                      className="w-full px-5 py-3 text-sm font-black text-gray-900 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-300 placeholder:font-normal uppercase tracking-tight"
                      placeholder="123 MAIN STREET"
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      className="w-full px-5 py-3 text-sm font-black text-gray-900 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-300 placeholder:font-normal uppercase tracking-tight"
                      placeholder="NEW YORK"
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      State/Province
                    </label>
                    <input
                      type="text"
                      className="w-full px-5 py-3 text-sm font-black text-gray-900 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-300 placeholder:font-normal uppercase tracking-tight"
                      placeholder="NY"
                      value={editState}
                      onChange={(e) => setEditState(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Jurisdiction
                    </label>
                    <input
                      type="text"
                      className="w-full px-5 py-3 text-sm font-black text-gray-900 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-300 placeholder:font-normal uppercase tracking-tight"
                      placeholder="USA"
                      value={editCountry}
                      onChange={(e) => setEditCountry(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      className="w-full px-5 py-3 text-sm font-black text-gray-900 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-300 placeholder:font-normal tracking-tight"
                      placeholder="10001"
                      value={editPostalCode}
                      onChange={(e) => setEditPostalCode(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                    Access Allocation Plan
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['starter', 'professional', 'enterprise'].map((planOption) => (
                      <div
                        key={planOption}
                        className={`group border rounded-[24px] p-6 cursor-pointer transition-all ${editPlan === planOption
                          ? 'border-indigo-600 bg-indigo-50/30'
                          : 'border-gray-100 hover:border-indigo-200 hover:bg-gray-50'
                          }`}
                        onClick={() => setEditPlan(planOption as 'starter' | 'professional' | 'enterprise')}
                      >
                        <div className="text-center">
                          <div className={`font-black uppercase text-xs tracking-widest mb-2 ${editPlan === planOption ? 'text-indigo-600' : 'text-gray-900'}`}>{planOption}</div>
                          <div className="text-sm font-black text-slate-400 group-hover:text-indigo-600/50 transition-colors">
                            {planOption === 'starter' && '$29/MO'}
                            {planOption === 'professional' && '$99/MO'}
                            {planOption === 'enterprise' && '$299/MO'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="p-8 border-t border-gray-100 flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingTenantId(null);
                  resetEditForm();
                }}
                className="px-8 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all"
              >
                DISCARD CHANGES
              </button>
              <button
                onClick={handleUpdateTenant}
                disabled={isUpdating || isLoadingTenantDetails || !editName || !editSubdomain || !editContactEmail}
                className="px-8 py-3 text-[10px] font-black bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all uppercase tracking-widest shadow-lg shadow-indigo-200 flex items-center gap-3"
              >
                {isUpdating && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                <span>{isUpdating ? 'SYNCING...' : 'SYNC CONFIGURATION'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tenant Details Modal */}
      {showDetailsModal && selectedTenant && (
        <div className="fixed inset-0 bg-[#0a0a0b]/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto border border-white/20">
            {/* Header */}
            <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 p-8 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-gray-900 rounded-[24px] flex items-center justify-center shadow-2xl relative overflow-hidden group">
                    <Building2 className="text-white relative z-10" size={32} />
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">{selectedTenant.name}</h2>
                      <div className={`w-2 h-2 rounded-full ${selectedTenant.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'} shadow-sm shadow-current/20`}></div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {selectedTenant.domain || selectedTenant.subdomain}
                        </span>
                      </div>
                      <div className="h-4 w-px bg-gray-200" />
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                        {selectedTenant.plan} ACCESS NODE
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-gray-900 hover:bg-gray-100 rounded-2xl transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-10">
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-[#fafafa] rounded-[24px] p-6 border border-gray-100 hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-indigo-600 border border-gray-100">
                      <Users size={18} />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TOTAL USERS</span>
                  </div>
                  <div className="text-3xl font-black text-gray-900 tracking-tight leading-none uppercase">{selectedTenant.userCount || 0}</div>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-4">Platform Seats</p>
                </div>

                <div className="bg-[#fafafa] rounded-[24px] p-6 border border-gray-100 hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-emerald-600 border border-gray-100">
                      <Truck size={18} />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ACTIVE ASSETS</span>
                  </div>
                  <div className="text-3xl font-black text-gray-900 tracking-tight leading-none uppercase">{selectedTenant.trucksCount || 0}</div>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-4">Fleet Capacity</p>
                </div>

                <div className="bg-[#fafafa] rounded-[24px] p-6 border border-gray-100 hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-purple-600 border border-gray-100">
                      <TrendingUp size={18} />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">FISCAL YIELD</span>
                  </div>
                  <div className="text-3xl font-black text-emerald-600 tracking-tight leading-none uppercase">${(selectedTenant.revenue || 0).toLocaleString()}</div>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-4">Monthly Revenue</p>
                </div>

                <div className="bg-[#fafafa] rounded-[24px] p-6 border border-gray-100 hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-amber-600 border border-gray-100">
                      <Calendar size={18} />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">LIFECYCLE</span>
                  </div>
                  <div className="text-3xl font-black text-gray-900 tracking-tight leading-none uppercase">
                    {Math.ceil((new Date().getTime() - new Date(selectedTenant.createdAt).getTime()) / (1000 * 3600 * 24))}
                  </div>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-4">Days Since Init</p>
                </div>
              </div>

              {/* Information Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Basic Information */}
                <div>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Building2 className="text-indigo-600" size={14} />
                    Core Infrastructure
                  </h3>
                  <div className="bg-white border border-gray-100 rounded-3xl p-6 space-y-4">
                    <div className="flex items-center justify-between pb-4 border-b border-gray-50">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Node ID</span>
                      <span className="text-sm font-black text-gray-900 tracking-tight font-mono truncate max-w-[200px]">{selectedTenant.id}</span>
                    </div>
                    <div className="flex items-center justify-between pb-4 border-b border-gray-50">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subdomain</span>
                      <span className="text-sm font-black text-indigo-600 tracking-tight uppercase">{selectedTenant.subdomain}</span>
                    </div>
                    <div className="flex items-center justify-between pb-4 border-b border-gray-50">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Primary Domain</span>
                      <span className="text-sm font-black text-gray-900 tracking-tight uppercase">{selectedTenant.domain || 'UNCONFIGURED'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Initialization Date</span>
                      <span className="text-sm font-black text-gray-900 tracking-tight uppercase">{new Date(selectedTenant.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Users className="text-emerald-600" size={14} />
                    Administrative Registry
                  </h3>
                  <div className="bg-white border border-gray-100 rounded-3xl p-6 space-y-4">
                    <div className="flex items-center justify-between pb-4 border-b border-gray-50">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Principal Admin</span>
                      <span className="text-sm font-black text-gray-900 tracking-tight uppercase">{selectedTenant.adminName || 'UNASSIGNED'}</span>
                    </div>
                    <div className="flex items-center justify-between pb-4 border-b border-gray-50">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registry Email</span>
                      <span className="text-sm font-black text-indigo-600 tracking-tight lowercase">{selectedTenant.contactEmail || 'MISSING'}</span>
                    </div>
                    <div className="flex items-center justify-between pb-4 border-b border-gray-50">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operational Base</span>
                      <span className="text-sm font-black text-gray-900 tracking-tight uppercase">{selectedTenant.location || 'GLOBAL'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trust Index (KYC)</span>
                      <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${getKYCStatusColor(selectedTenant.kycStatus || 'PENDING')}`}>
                        {selectedTenant.kycStatus || 'PENDING'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subscription Details Section */}
              <TenantSubscriptionDetails tenantId={selectedTenant.id} />

              {/* Quick Actions */}
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Settings className="text-purple-600" size={14} />
                  Operational Procedures
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button
                    onClick={() => {
                      handleEditTenant(selectedTenant);
                      setShowDetailsModal(false);
                    }}
                    className="flex flex-col items-center justify-center p-6 bg-[#fafafa] border border-gray-100 rounded-3xl hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group shadow-sm hover:shadow-md"
                  >
                    <Edit className="text-slate-400 group-hover:text-indigo-600 mb-3 transition-colors" size={24} />
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest group-hover:text-indigo-600">Modify Node</span>
                  </button>

                  <button
                    onClick={() => {
                      setSettingsTenantId(selectedTenant.id);
                      setShowSettingsModal(true);
                      setShowDetailsModal(false);
                    }}
                    className="flex flex-col items-center justify-center p-6 bg-[#fafafa] border border-gray-100 rounded-3xl hover:border-purple-200 hover:bg-purple-50/30 transition-all group shadow-sm hover:shadow-md"
                  >
                    <Settings className="text-slate-400 group-hover:text-purple-600 mb-3 transition-colors" size={24} />
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest group-hover:text-purple-600">Protocol Sync</span>
                  </button>

                  <button
                    onClick={() => {
                      setManageUsersTenantId(selectedTenant.id);
                      setManageUsersTenantName(selectedTenant.name);
                      setShowManageUsersModal(true);
                      setShowDetailsModal(false);
                    }}
                    className="flex flex-col items-center justify-center p-6 bg-[#fafafa] border border-gray-100 rounded-3xl hover:border-emerald-200 hover:bg-emerald-50/30 transition-all group shadow-sm hover:shadow-md"
                  >
                    <Users className="text-slate-400 group-hover:text-emerald-600 mb-3 transition-colors" size={24} />
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest group-hover:text-emerald-600">Seat Audit</span>
                  </button>

                  <button
                    onClick={() => {
                      setKYCTenant(selectedTenant);
                      setShowKYCModal(true);
                      setShowDetailsModal(false);
                    }}
                    className="flex flex-col items-center justify-center p-6 bg-[#fafafa] border border-gray-100 rounded-3xl hover:border-amber-200 hover:bg-amber-50/30 transition-all group shadow-sm hover:shadow-md"
                  >
                    <ShieldCheck className="text-slate-400 group-hover:text-amber-600 mb-3 transition-colors" size={24} />
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest group-hover:text-amber-600">Trust Verify</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-8 border-t border-gray-100">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-8 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all"
                >
                  DISMISS
                </button>
                <div className="flex gap-4">
                  <button className="px-8 py-3 text-[10px] font-black bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all uppercase tracking-widest shadow-lg shadow-indigo-200 flex items-center gap-2">
                    <Download className="w-3 h-3" />
                    EXPORT TELEMETRY
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
                    className="px-8 py-3 text-[10px] font-black bg-gray-900 text-white rounded-2xl hover:bg-black transition-all uppercase tracking-widest shadow-lg shadow-gray-200"
                  >
                    SYSTEM LOGS
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

  if (isLoading) {
    return (
      <div className="bg-[#fafafa] border border-gray-100 rounded-[32px] p-8 mt-10">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
          <CreditCard className="text-purple-600" size={14} />
          Fiscal Agreement
        </h3>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Synchronizing Ledgers...</span>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="bg-[#fafafa] border border-gray-100 rounded-[32px] p-8 mt-10">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
          <CreditCard className="text-purple-600" size={14} />
          Fiscal Agreement
        </h3>
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-50">
            <AlertTriangle className="text-slate-300" size={24} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">No Active Protocol Found</p>
          <button
            onClick={() => navigate('/admin/subscriptions')}
            className="px-8 py-3 text-[10px] font-black bg-purple-600 text-white rounded-2xl hover:bg-purple-700 transition-all uppercase tracking-widest shadow-lg shadow-purple-100"
          >
            Initialize Protocol
          </button>
        </div>
      </div>
    );
  }

  const isTrial = subscription.status === 'trial';

  return (
    <div className="bg-[#fafafa] border border-gray-100 rounded-[32px] p-8 mt-10">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <CreditCard className="text-purple-600" size={14} />
          Fiscal Agreement
        </h3>
        <button
          onClick={() => navigate('/admin/subscriptions')}
          className="text-[10px] font-black text-purple-600 hover:text-purple-700 uppercase tracking-widest flex items-center gap-1 bg-white px-4 py-2 rounded-xl border border-purple-100 shadow-sm transition-all"
        >
          <Settings className="w-3 h-3" />
          Protocol Sync
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-gray-50">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Access Tier</span>
            <span className="text-sm font-black text-gray-900 tracking-tight uppercase">{subscription.plan.name}</span>
          </div>
          <div className="flex items-center justify-between pb-4 border-b border-gray-50">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Status</span>
            <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-indigo-100 bg-indigo-50 text-indigo-600`}>
              {subscription.status}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Yield Frequency</span>
            <span className="text-sm font-black text-gray-900 tracking-tight uppercase">{subscription.billingCycle}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-gray-50">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Credit Liquidity</span>
            <span className="text-sm font-black text-purple-600 tracking-tight uppercase">{subscription.creditBalance || 0} UNITS</span>
          </div>
          <div className="flex items-center justify-between pb-4 border-b border-gray-50">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lifecycle End</span>
            <span className="text-sm font-black text-gray-900 tracking-tight uppercase">
              {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recursive Billing</span>
            <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${subscription.autoRenew ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-50 text-gray-600 border-gray-100'}`}>
              {subscription.autoRenew ? 'ACTIVE' : 'DISABLED'}
            </span>
          </div>
        </div>
      </div>

      {/* Trial Protocol Banner */}
      {isTrial && subscription.trialEnd && (
        <div className="mt-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-[24px] p-6 shadow-lg shadow-indigo-100">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Trial Protocol Active</p>
              <p className="text-sm font-black tracking-tight uppercase">
                Termination scheduled for {new Date(subscription.trialEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Protocol Metrics */}
      <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="bg-white rounded-[24px] p-6 border border-gray-100 hover:border-purple-100 transition-all group">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 group-hover:text-purple-600 transition-colors">Included Credits</div>
          <div className="text-2xl font-black text-gray-900 tracking-tight">{subscription.plan.includedCredits}</div>
        </div>
        <div className="bg-white rounded-[24px] p-6 border border-gray-100 hover:border-emerald-100 transition-all group">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 group-hover:text-emerald-600 transition-colors">Cumulative Yield</div>
          <div className="text-2xl font-black text-gray-900 tracking-tight">${(subscription.totalRevenue || 0).toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
};

export default AdminTenants;