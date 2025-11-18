import React, { useState } from 'react';
import { FaPlus, FaEye, FaEdit, FaTrash, FaDownload, FaFilter, FaSearch, FaShieldAlt, FaTruck, FaCalendarAlt, FaDollarSign } from 'react-icons/fa';

const PolicyManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Mock data for policies
  const policies = [
    {
      id: 'INS-2024-001',
      truckId: 'TRK-001',
      truckPlate: 'ABC-123',
      insuranceCompany: 'State Farm',
      policyType: 'Comprehensive',
      coverageAmount: 500000,
      premium: 1200,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      status: 'active',
      deductible: 1000,
      coverageTypes: ['Liability', 'Collision', 'Comprehensive', 'Cargo'],
    },
    {
      id: 'INS-2024-002',
      truckId: 'TRK-002',
      truckPlate: 'XYZ-789',
      insuranceCompany: 'Allstate',
      policyType: 'Liability',
      coverageAmount: 300000,
      premium: 800,
      startDate: '2024-02-01',
      endDate: '2025-01-31',
      status: 'active',
      deductible: 1500,
      coverageTypes: ['Liability', 'Cargo'],
    },
    {
      id: 'INS-2024-003',
      truckId: 'TRK-003',
      truckPlate: 'DEF-456',
      insuranceCompany: 'Progressive',
      policyType: 'Full Coverage',
      coverageAmount: 750000,
      premium: 1800,
      startDate: '2024-03-01',
      endDate: '2025-02-28',
      status: 'pending',
      deductible: 500,
      coverageTypes: ['Liability', 'Collision', 'Comprehensive', 'Cargo', 'Uninsured Motorist'],
    },
    {
      id: 'INS-2024-004',
      truckId: 'TRK-004',
      truckPlate: 'GHI-789',
      insuranceCompany: 'Geico',
      policyType: 'Commercial',
      coverageAmount: 1000000,
      premium: 2200,
      startDate: '2023-12-01',
      endDate: '2024-11-30',
      status: 'expired',
      deductible: 2000,
      coverageTypes: ['Liability', 'Collision', 'Comprehensive', 'Cargo', 'Medical Payments'],
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredPolicies = policies.filter(policy => {
    const matchesSearch = policy.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         policy.truckPlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         policy.insuranceCompany.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || policy.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search policies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <div className="flex space-x-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="expired">Expired</option>
          </select>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FaPlus className="mr-2" />
            Add Policy
          </button>
        </div>
      </div>

      {/* Policies Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Policy Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Truck Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Coverage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPolicies.map((policy) => (
                <tr key={policy.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{policy.id}</div>
                      <div className="text-sm text-gray-500">{policy.insuranceCompany}</div>
                      <div className="text-sm text-gray-500">{policy.policyType}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <FaTruck className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{policy.truckPlate}</div>
                        <div className="text-sm text-gray-500">ID: {policy.truckId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        ${policy.coverageAmount.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">Deductible: ${policy.deductible}</div>
                      <div className="text-xs text-gray-400">
                        {policy.coverageTypes.slice(0, 2).join(', ')}
                        {policy.coverageTypes.length > 2 && '...'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <FaCalendarAlt className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm text-gray-900">{policy.startDate}</div>
                        <div className="text-sm text-gray-500">to {policy.endDate}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(policy.status)}`}>
                      {policy.status.charAt(0).toUpperCase() + policy.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <FaEye className="h-4 w-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900">
                        <FaEdit className="h-4 w-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <FaTrash className="h-4 w-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-900">
                        <FaDownload className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center">
            <FaShieldAlt className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Policies</p>
              <p className="text-2xl font-bold text-gray-900">{policies.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center">
            <FaDollarSign className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Premium</p>
              <p className="text-2xl font-bold text-gray-900">
                ${policies.reduce((sum, p) => sum + p.premium, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center">
            <FaTruck className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Insured Trucks</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(policies.map(p => p.truckId)).size}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center">
            <FaCalendarAlt className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Expiring Soon</p>
              <p className="text-2xl font-bold text-gray-900">
                {policies.filter(p => p.status === 'active').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Policy Modal Placeholder */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Policy</h3>
              <p className="text-sm text-gray-500 mb-4">Policy creation form would go here</p>
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PolicyManagement;
