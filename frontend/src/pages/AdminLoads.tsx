import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaBox, FaMapMarkerAlt, FaCalendarAlt, FaSpinner, FaWeight,
  FaSearch, FaFilter, FaDownload, FaEye, FaEdit, FaTrash, FaDollarSign
} from 'react-icons/fa';
import { TranslatedText } from '../components/translated-text';
import { useAuth } from '../contexts/AuthContext';
import AdminPageLayout from '../components/Admin/AdminPageLayout';
import { adminAPI, type AdminLoad } from '../services/adminApi';

const AdminLoads: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loads, setLoads] = useState<AdminLoad[]>([]);
  const [filteredLoads, setFilteredLoads] = useState<AdminLoad[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tenantFilter, setTenantFilter] = useState('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  /** Safely extract a display string from a location field that may be a string or an object */
  const locStr = (loc: any): string => {
    if (!loc) return '';
    if (typeof loc === 'string') return loc;
    if (typeof loc === 'object') {
      return loc.city || loc.address || loc.name || `${loc.lat ?? ''},${loc.lng ?? ''}`;
    }
    return String(loc);
  };

  // Fetch loads data
  useEffect(() => {
    const fetchLoads = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await adminAPI.getAllLoads();
        console.log('Loads API Response:', response);
        
        // The response should be { data: { loads: [...] } }
        const loadsData = response.data?.loads || [];
        
        setLoads(loadsData);
        setFilteredLoads(loadsData);
      } catch (err: any) {
        console.error('Error fetching loads:', err);
        setError(err.response?.data?.message || 'Failed to load loads data');
      } finally {
        setLoading(false);
      }
    };

    fetchLoads();
  }, []);

  // Filter loads based on search and filters
  useEffect(() => {
    let filtered = loads;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(load =>
        load.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        locStr(load.origin).toLowerCase().includes(searchTerm.toLowerCase()) ||
        locStr(load.destination).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(load => load.status === statusFilter);
    }

    // Tenant filter
    if (tenantFilter !== 'all') {
      filtered = filtered.filter(load => load.tenantId === tenantFilter);
    }

    setFilteredLoads(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [loads, searchTerm, statusFilter, tenantFilter]);

  // Get unique values for filters
  const uniqueStatuses = [...new Set(loads.map(load => load.status))];
  const uniqueTenants = [...new Set(loads.map(load => load.tenantId))];

  // Pagination calculations
  const totalPages = Math.ceil(filteredLoads.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLoads = filteredLoads.slice(startIndex, endIndex);

  // Status color helper
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'active':
      case 'in_transit':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'delivered':
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Format status text
  const formatStatus = (status: string) => {
    return status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
  };

  // Calculate stats
  const totalValue = loads.reduce((sum, load) => sum + (load.value || 0), 0);
  const totalWeight = loads.reduce((sum, load) => sum + (load.weight || 0), 0);

  if (loading) {
    return (
      <AdminPageLayout
        title="Load Management"
        description="Monitor and manage all cargo loads across the platform"
      >
        <div className="flex items-center justify-center h-64">
          <FaSpinner className="animate-spin text-4xl text-indigo-600" />
          <span className="ml-3 text-lg text-gray-600">Loading loads data...</span>
        </div>
      </AdminPageLayout>
    );
  }

  if (error) {
    return (
      <AdminPageLayout
        title="Load Management"
        description="Monitor and manage all cargo loads across the platform"
      >
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="text-red-400">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Loads</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={() => window.location.reload()}
              className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-md text-sm font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      title="Load Management"
      description="Monitor and manage all cargo loads across the platform"
    >
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Loads</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{loads.length}</p>
              </div>
              <FaBox className="text-4xl text-blue-500 opacity-50" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Completed</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {loads.filter(l => ['delivered', 'completed'].includes(l.status?.toLowerCase())).length}
                </p>
              </div>
              <FaBox className="text-4xl text-green-500 opacity-50" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Weight</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {totalWeight.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">lbs</p>
              </div>
              <FaWeight className="text-4xl text-yellow-500 opacity-50" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Value</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  ${totalValue.toLocaleString()}
                </p>
              </div>
              <FaDollarSign className="text-4xl text-purple-500 opacity-50" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 items-center w-full md:w-auto">
              {/* Search */}
              <div className="relative w-full md:w-64">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search loads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                {uniqueStatuses.map(status => (
                  <option key={status} value={status}>{formatStatus(status)}</option>
                ))}
              </select>

              {/* Tenant Filter */}
              <select
                value={tenantFilter}
                onChange={(e) => setTenantFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Tenants</option>
                {uniqueTenants.map(tenantId => (
                  <option key={tenantId} value={tenantId}>Tenant {tenantId}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
                <FaDownload />
                Export
              </button>
              <span className="px-4 py-2 bg-indigo-100 text-indigo-800 rounded-lg font-medium">
                {filteredLoads.length} loads
              </span>
            </div>
          </div>
        </div>

        {/* Loads Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Load Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Route
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Weight
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentLoads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <FaBox className="text-4xl text-gray-400 mb-4" />
                        <p className="text-gray-500 text-lg font-medium">No loads found</p>
                        <p className="text-gray-400 text-sm">Try adjusting your search or filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentLoads.map((load) => (
                    <tr key={load.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center">
                              <FaBox className="text-orange-600 text-xl" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {load.title || `Load #${load.id.slice(-8)}`}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {load.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <FaMapMarkerAlt className="text-gray-400 mr-2" />
                          <div>
                            <div className="font-medium">{locStr(load.origin) || 'Unknown'}</div>
                            <div className="text-gray-500">→ {locStr(load.destination) || 'Unknown'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(load.status)}`}>
                          {formatStatus(load.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {load.weight ? `${load.weight.toLocaleString()} lbs` : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {load.value ? `$${load.value.toLocaleString()}` : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500">
                          <FaCalendarAlt className="mr-1" />
                          {new Date(load.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {/* Handle view details */}}
                            className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                            title="View Details"
                          >
                            <FaEye />
                          </button>
                          <button
                            onClick={() => {/* Handle edit */}}
                            className="text-green-600 hover:text-green-900 p-1 rounded"
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => {/* Handle delete */}}
                            className="text-red-600 hover:text-red-900 p-1 rounded"
                            title="Delete"
                          >
                            <FaTrash />
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
          {filteredLoads.length > itemsPerPage && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(endIndex, filteredLoads.length)}</span> of{' '}
                    <span className="font-medium">{filteredLoads.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    
                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === pageNum
                              ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminPageLayout>
  );
};

export default AdminLoads;