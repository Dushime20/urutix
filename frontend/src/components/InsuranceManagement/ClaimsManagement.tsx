import React, { useState } from 'react';
import { FaPlus, FaEye, FaEdit, FaTrash, FaDownload, FaFilter, FaSearch, FaExclamationTriangle, FaClock, FaCheckCircle, FaTimesCircle, FaFileAlt, FaDollarSign, FaTruck } from 'react-icons/fa';

const ClaimsManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Mock data for claims
  const claims = [
    {
      id: 'CLM-2024-001',
      policyId: 'INS-2024-001',
      truckId: 'TRK-001',
      truckPlate: 'ABC-123',
      claimType: 'Collision',
      description: 'Rear-end collision on highway I-95',
      incidentDate: '2024-06-15',
      reportedDate: '2024-06-16',
      estimatedAmount: 15000,
      approvedAmount: 14200,
      status: 'approved',
      adjuster: 'John Smith',
      notes: 'Claim approved after investigation. Driver was not at fault.',
      documents: ['Police Report', 'Photos', 'Repair Estimate'],
    },
    {
      id: 'CLM-2024-002',
      policyId: 'INS-2024-002',
      truckId: 'TRK-002',
      truckPlate: 'XYZ-789',
      claimType: 'Cargo Damage',
      description: 'Cargo damaged during transit due to road conditions',
      incidentDate: '2024-06-10',
      reportedDate: '2024-06-11',
      estimatedAmount: 8000,
      approvedAmount: 0,
      status: 'pending',
      adjuster: 'Sarah Johnson',
      notes: 'Under investigation. Waiting for cargo inspection report.',
      documents: ['Cargo Manifest', 'Photos', 'Driver Statement'],
    },
    {
      id: 'CLM-2024-003',
      policyId: 'INS-2024-003',
      truckId: 'TRK-003',
      truckPlate: 'DEF-456',
      claimType: 'Theft',
      description: 'Truck stolen from parking lot',
      incidentDate: '2024-06-05',
      reportedDate: '2024-06-05',
      estimatedAmount: 45000,
      approvedAmount: 0,
      status: 'investigating',
      adjuster: 'Mike Wilson',
      notes: 'Police investigation ongoing. GPS tracking shows truck in different location.',
      documents: ['Police Report', 'GPS Data', 'Security Footage'],
    },
    {
      id: 'CLM-2024-004',
      policyId: 'INS-2024-004',
      truckId: 'TRK-004',
      truckPlate: 'GHI-789',
      claimType: 'Weather Damage',
      description: 'Hail damage to truck body and windshield',
      incidentDate: '2024-05-28',
      reportedDate: '2024-05-29',
      estimatedAmount: 3500,
      approvedAmount: 3200,
      status: 'closed',
      adjuster: 'Lisa Brown',
      notes: 'Claim processed and payment issued. Repairs completed.',
      documents: ['Weather Report', 'Photos', 'Repair Invoice'],
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'investigating':
        return 'bg-blue-100 text-blue-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      case 'denied':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return FaCheckCircle;
      case 'pending':
        return FaClock;
      case 'investigating':
        return FaExclamationTriangle;
      case 'closed':
        return FaCheckCircle;
      case 'denied':
        return FaTimesCircle;
      default:
        return FaClock;
    }
  };

  const filteredClaims = claims.filter(claim => {
    const matchesSearch = claim.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         claim.truckPlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         claim.claimType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || claim.status === filterStatus;
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
              placeholder="Search claims..."
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
            <option value="pending">Pending</option>
            <option value="investigating">Investigating</option>
            <option value="approved">Approved</option>
            <option value="closed">Closed</option>
            <option value="denied">Denied</option>
          </select>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FaPlus className="mr-2" />
            File Claim
          </button>
        </div>
      </div>

      {/* Claims Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Claim Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Truck Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Incident
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Financial
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
              {filteredClaims.map((claim) => {
                const StatusIcon = getStatusIcon(claim.status);
                return (
                  <tr key={claim.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{claim.id}</div>
                        <div className="text-sm text-gray-500">Policy: {claim.policyId}</div>
                        <div className="text-sm text-gray-500">{claim.claimType}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <FaTruck className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{claim.truckPlate}</div>
                          <div className="text-sm text-gray-500">ID: {claim.truckId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm text-gray-900">{claim.incidentDate}</div>
                        <div className="text-sm text-gray-500">Reported: {claim.reportedDate}</div>
                        <div className="text-xs text-gray-400 truncate max-w-xs">
                          {claim.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm text-gray-900">
                          Est: ${claim.estimatedAmount.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          Approved: ${claim.approvedAmount.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-400">
                          Adjuster: {claim.adjuster}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <StatusIcon className="h-4 w-4 mr-2" />
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(claim.status)}`}>
                          {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900" title="View Details">
                          <FaEye className="h-4 w-4" />
                        </button>
                        <button className="text-green-600 hover:text-green-900" title="Edit Claim">
                          <FaEdit className="h-4 w-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-900" title="Documents">
                          <FaFileAlt className="h-4 w-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-900" title="Download">
                          <FaDownload className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center">
            <FaExclamationTriangle className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Claims</p>
              <p className="text-2xl font-bold text-gray-900">{claims.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center">
            <FaDollarSign className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Approved</p>
              <p className="text-2xl font-bold text-gray-900">
                ${claims.reduce((sum, c) => sum + c.approvedAmount, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center">
            <FaClock className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending Claims</p>
              <p className="text-2xl font-bold text-gray-900">
                {claims.filter(c => c.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center">
            <FaCheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Closed Claims</p>
              <p className="text-2xl font-bold text-gray-900">
                {claims.filter(c => c.status === 'closed').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border p-6 mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Claim Activity</h3>
        <div className="space-y-4">
          {claims.slice(0, 3).map((claim) => (
            <div key={claim.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                <div className={`p-2 rounded-full ${getStatusColor(claim.status)}`}>
                  {React.createElement(getStatusIcon(claim.status), { className: "h-4 w-4" })}
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {claim.claimType} claim {claim.id} {claim.status}
                </p>
                <p className="text-xs text-gray-500">
                  {claim.truckPlate} • {claim.incidentDate}
                </p>
              </div>
              <div className="text-xs text-gray-400">
                ${claim.estimatedAmount.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* File Claim Modal Placeholder */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4">File New Claim</h3>
              <p className="text-sm text-gray-500 mb-4">Claim submission form would go here</p>
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

export default ClaimsManagement;
