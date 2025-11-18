import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createTenant, fetchTenants } from '../services/adminApi';
import { 
  FaBuilding, FaEdit, FaPlus, FaSearch, FaDownload,
  FaEye, FaCheck, FaTimes, FaBan,
  FaSort, FaEllipsisV, FaGlobe, FaUsers, FaChartLine,
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
  
  useQuery({ 
    queryKey: ['admin-tenants'], 
    queryFn: fetchTenants 
  });

  // Form state
  const [name, setName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [adminName, setAdminName] = useState('');
  const [plan, setPlan] = useState<'starter' | 'professional' | 'enterprise'>('starter');
  
  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Mock data - in real app this would come from the API
  const [tenants] = useState<Tenant[]>([
    {
      id: '1',
      name: 'TransCorp Rwanda',
      subdomain: 'transcorp',
      status: 'active',
      createdAt: '2024-01-15',
      lastActivity: '2024-08-09 10:30',
      userCount: 156,
      trucksCount: 45,
      revenue: 125000,
      plan: 'professional',
      domain: 'transcorp.urutix.com',
      contactEmail: 'admin@transcorp.rw',
      adminName: 'Jean Baptiste',
      location: 'Kigali, Rwanda'
    },
    {
      id: '2',
      name: 'Logistics Pro',
      subdomain: 'logpro',
      status: 'active',
      createdAt: '2024-02-20',
      lastActivity: '2024-08-09 08:45',
      userCount: 89,
      trucksCount: 23,
      revenue: 67000,
      plan: 'starter',
      domain: 'logpro.urutix.com',
      contactEmail: 'info@logpro.com',
      adminName: 'Mary Johnson',
      location: 'Nairobi, Kenya'
    },
    {
      id: '3',
      name: 'Enterprise Freight',
      subdomain: 'entfreight',
      status: 'pending',
      createdAt: '2024-08-05',
      lastActivity: '2024-08-08 16:20',
      userCount: 12,
      trucksCount: 5,
      revenue: 15000,
      plan: 'enterprise',
      domain: 'entfreight.urutix.com',
      contactEmail: 'contact@entfreight.co',
      adminName: 'David Wilson',
      location: 'Lagos, Nigeria'
    }
  ]);

  const { mutate, isPending: isCreating } = useMutation({
    mutationFn: (payload: any) => createTenant(payload),
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ['admin-tenants'] }); 
      resetForm();
      setShowCreateModal(false);
    },
  });

  const resetForm = () => {
    setName('');
    setSubdomain('');
    setContactEmail('');
    setAdminName('');
    setPlan('starter');
  };

  // Filter and sort tenants
  const filteredTenants = tenants
    .filter(tenant => {
      const matchesSearch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          tenant.subdomain.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          tenant.contactEmail?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter;
      const matchesPlan = planFilter === 'all' || tenant.plan === planFilter;
      return matchesSearch && matchesStatus && matchesPlan;
    })
    .sort((a, b) => {
      const aValue = a[sortBy as keyof Tenant] || '';
      const bValue = b[sortBy as keyof Tenant] || '';
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'starter': return 'bg-blue-100 text-blue-800';
      case 'professional': return 'bg-purple-100 text-purple-800';
      case 'enterprise': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <FaCheck className="text-green-500" />;
      case 'inactive': return <FaTimes className="text-gray-500" />;
      case 'pending': return <FaExclamationTriangle className="text-yellow-500" />;
      case 'suspended': return <FaBan className="text-red-500" />;
      default: return <FaTimes className="text-gray-500" />;
    }
  };

  const handleCreateTenant = () => {
    mutate({
      name,
      subdomain,
      contactEmail,
      adminName,
      plan
    });
  };

  const stats = [
    { label: 'Total Tenants', value: tenants.length, icon: FaBuilding, color: 'from-blue-500 to-blue-600' },
    { label: 'Active Tenants', value: tenants.filter(t => t.status === 'active').length, icon: FaCheck, color: 'from-green-500 to-green-600' },
    { label: 'Total Users', value: tenants.reduce((sum, t) => sum + (t.userCount || 0), 0), icon: FaUsers, color: 'from-purple-500 to-purple-600' },
    { label: 'Total Revenue', value: `$${tenants.reduce((sum, t) => sum + (t.revenue || 0), 0).toLocaleString()}`, icon: FaChartLine, color: 'from-yellow-500 to-yellow-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tenant Management</h1>
          <p className="text-gray-600 mt-1">Manage platform tenants and their configurations</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl flex items-center space-x-2 hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg"
        >
          <FaPlus />
          <span>Add Tenant</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center`}>
                  <Icon className="text-white text-lg" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search tenants..."
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
          >
            <option value="all">All Plans</option>
            <option value="starter">Starter</option>
            <option value="professional">Professional</option>
            <option value="enterprise">Enterprise</option>
          </select>

          <button className="px-4 py-3 border border-gray-200 rounded-xl flex items-center justify-center space-x-2 hover:bg-gray-50 transition-colors">
            <FaDownload />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  <button 
                    className="flex items-center space-x-1"
                    onClick={() => {
                      setSortBy('name');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    <span>Tenant</span>
                    <FaSort />
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Domain</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Plan</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Users</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Revenue</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Last Activity</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                        <FaBuilding className="text-white text-sm" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{tenant.name}</div>
                        <div className="text-sm text-gray-500">{tenant.adminName}</div>
                        <div className="text-xs text-gray-400">{tenant.location}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-1">
                      <FaGlobe className="text-gray-400 text-sm" />
                      <span className="text-sm text-gray-900">{tenant.domain}</span>
                    </div>
                    <div className="text-xs text-gray-500">{tenant.contactEmail}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPlanColor(tenant.plan)}`}>
                      {tenant.plan.charAt(0).toUpperCase() + tenant.plan.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(tenant.status)}
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(tenant.status)}`}>
                        {tenant.status.charAt(0).toUpperCase() + tenant.status.slice(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{tenant.userCount}</div>
                    <div className="text-xs text-gray-500">{tenant.trucksCount} trucks</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-gray-900">
                      ${tenant.revenue?.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {new Date(tenant.lastActivity).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(tenant.lastActivity).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => {
                          setSelectedTenant(tenant);
                          setShowDetailsModal(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <FaEye />
                      </button>
                      <button 
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button 
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        title="Settings"
                      >
                        <FaCog />
                      </button>
                      <button 
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        title="More"
                      >
                        <FaEllipsisV />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Tenant Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Create New Tenant</h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <FaTimes />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tenant Name *
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter tenant name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Subdomain *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="subdomain"
                      value={subdomain}
                      onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                      .urutix.com
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Admin Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter admin name"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="admin@company.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Subscription Plan
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['starter', 'professional', 'enterprise'].map((planOption) => (
                    <div
                      key={planOption}
                      className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                        plan === planOption 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setPlan(planOption as 'starter' | 'professional' | 'enterprise')}
                    >
                      <div className="text-center">
                        <div className="font-semibold text-gray-900 capitalize">{planOption}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          {planOption === 'starter' && '$29/month'}
                          {planOption === 'professional' && '$99/month'}
                          {planOption === 'enterprise' && '$299/month'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <FaShieldAlt className="text-blue-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-blue-900">Security Notice</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      A new tenant will be created with default security settings. The admin will receive setup instructions via email.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="px-6 py-3 text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTenant}
                disabled={isCreating || !name || !subdomain || !contactEmail}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isCreating && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                <span>{isCreating ? 'Creating...' : 'Create Tenant'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tenant Details Modal */}
      {showDetailsModal && selectedTenant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <FaBuilding className="text-white text-lg" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedTenant.name}</h2>
                    <p className="text-gray-600">{selectedTenant.domain}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <FaTimes />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Status and Plan */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(selectedTenant.status)}
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedTenant.status)}`}>
                      {selectedTenant.status.charAt(0).toUpperCase() + selectedTenant.status.slice(1)}
                    </span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPlanColor(selectedTenant.plan)}`}>
                    {selectedTenant.plan.charAt(0).toUpperCase() + selectedTenant.plan.slice(1)} Plan
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Manage Access
                  </button>
                  <button className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                    View Logs
                  </button>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <FaUsers className="text-blue-600 text-lg" />
                    <div>
                      <div className="text-2xl font-bold text-blue-900">{selectedTenant.userCount}</div>
                      <div className="text-sm text-blue-700">Total Users</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <FaTruck className="text-green-600 text-lg" />
                    <div>
                      <div className="text-2xl font-bold text-green-900">{selectedTenant.trucksCount}</div>
                      <div className="text-sm text-green-700">Active Trucks</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <FaChartLine className="text-purple-600 text-lg" />
                    <div>
                      <div className="text-2xl font-bold text-purple-900">${selectedTenant.revenue?.toLocaleString()}</div>
                      <div className="text-sm text-purple-700">Monthly Revenue</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <FaCalendarAlt className="text-yellow-600 text-lg" />
                    <div>
                      <div className="text-2xl font-bold text-yellow-900">
                        {Math.ceil((new Date().getTime() - new Date(selectedTenant.createdAt).getTime()) / (1000 * 3600 * 24))}
                      </div>
                      <div className="text-sm text-yellow-700">Days Active</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tenant Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Tenant Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium">{new Date(selectedTenant.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Activity:</span>
                      <span className="font-medium">{new Date(selectedTenant.lastActivity).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Admin:</span>
                      <span className="font-medium">{selectedTenant.adminName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Contact:</span>
                      <span className="font-medium">{selectedTenant.contactEmail}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Location:</span>
                      <span className="font-medium">{selectedTenant.location}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
                  <div className="space-y-3">
                    <button className="w-full flex items-center space-x-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <FaCog className="text-gray-400" />
                      <span>Tenant Settings</span>
                    </button>
                    <button className="w-full flex items-center space-x-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <FaUsers className="text-gray-400" />
                      <span>Manage Users</span>
                    </button>
                    <button className="w-full flex items-center space-x-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <FaShieldAlt className="text-gray-400" />
                      <span>Security Settings</span>
                    </button>
                    <button className="w-full flex items-center space-x-3 p-3 text-left border border-red-200 rounded-lg hover:bg-red-50 transition-colors text-red-600">
                      <FaBan className="text-red-400" />
                      <span>Suspend Tenant</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminTenants;


