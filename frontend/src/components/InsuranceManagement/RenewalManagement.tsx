import React, { useState } from 'react';
import { FaPlus, FaEye, FaEdit, FaTrash, FaDownload, FaFilter, FaSearch, FaCalendarAlt, FaClock, FaExclamationTriangle, FaCheckCircle, FaBell, FaShieldAlt, FaTruck, FaDollarSign, FaTimesCircle } from 'react-icons/fa';

const RenewalManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Mock data for renewals
  const renewals = [
    {
      id: 'REN-2024-001',
      policyId: 'INS-2024-001',
      truckId: 'TRK-001',
      truckPlate: 'ABC-123',
      insuranceCompany: 'State Farm',
      currentEndDate: '2024-12-31',
      renewalDate: '2024-12-15',
      daysUntilRenewal: 45,
      estimatedPremium: 1300,
      currentPremium: 1200,
      status: 'upcoming',
      autoRenew: true,
      coverageChanges: ['Increased liability limits', 'Added roadside assistance'],
      notes: 'Consider adding uninsured motorist coverage',
    },
    {
      id: 'REN-2024-002',
      policyId: 'INS-2024-002',
      truckId: 'TRK-002',
      truckPlate: 'XYZ-789',
      insuranceCompany: 'Allstate',
      currentEndDate: '2025-01-31',
      renewalDate: '2025-01-15',
      daysUntilRenewal: 75,
      estimatedPremium: 850,
      currentPremium: 800,
      status: 'upcoming',
      autoRenew: false,
      coverageChanges: ['No changes planned'],
      notes: 'Review cargo coverage limits',
    },
    {
      id: 'REN-2024-003',
      policyId: 'INS-2024-003',
      truckId: 'TRK-003',
      truckPlate: 'DEF-456',
      insuranceCompany: 'Progressive',
      currentEndDate: '2025-02-28',
      renewalDate: '2025-02-15',
      daysUntilRenewal: 105,
      estimatedPremium: 1900,
      currentPremium: 1800,
      status: 'upcoming',
      autoRenew: true,
      coverageChanges: ['Added rental reimbursement', 'Increased collision deductible'],
      notes: 'Good driving record discount applied',
    },
    {
      id: 'REN-2024-004',
      policyId: 'INS-2024-004',
      truckId: 'TRK-004',
      truckPlate: 'GHI-789',
      insuranceCompany: 'Geico',
      currentEndDate: '2024-11-30',
      renewalDate: '2024-11-15',
      daysUntilRenewal: 15,
      estimatedPremium: 2400,
      currentPremium: 2200,
      status: 'urgent',
      autoRenew: false,
      coverageChanges: ['Comprehensive coverage review needed'],
      notes: 'URGENT: Policy expires soon, contact agent immediately',
    },
    {
      id: 'REN-2024-005',
      policyId: 'INS-2024-005',
      truckId: 'TRK-005',
      truckPlate: 'JKL-012',
      insuranceCompany: 'Farmers',
      currentEndDate: '2024-10-31',
      renewalDate: '2024-10-15',
      daysUntilRenewal: -5,
      estimatedPremium: 1600,
      currentPremium: 1500,
      status: 'expired',
      autoRenew: false,
      coverageChanges: ['Policy lapsed'],
      notes: 'Policy expired. Need to reinstate or find new coverage.',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'upcoming':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'urgent':
        return FaExclamationTriangle;
      case 'upcoming':
        return FaClock;
      case 'completed':
        return FaCheckCircle;
      case 'expired':
        return FaTimesCircle;
      default:
        return FaClock;
    }
  };

  const getDaysUntilRenewalColor = (days: number) => {
    if (days < 0) return 'text-red-600';
    if (days <= 30) return 'text-red-600';
    if (days <= 60) return 'text-yellow-600';
    return 'text-green-600';
  };

  const filteredRenewals = renewals.filter(renewal => {
    const matchesSearch = renewal.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         renewal.truckPlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         renewal.insuranceCompany.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || renewal.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const urgentRenewals = renewals.filter(r => r.status === 'urgent' || r.daysUntilRenewal <= 30);
  const upcomingRenewals = renewals.filter(r => r.status === 'upcoming' && r.daysUntilRenewal > 30);

  return (
    <div className="p-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search renewals..."
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
            <option value="urgent">Urgent</option>
            <option value="upcoming">Upcoming</option>
            <option value="completed">Completed</option>
            <option value="expired">Expired</option>
          </select>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FaPlus className="mr-2" />
            Add Renewal
          </button>
        </div>
      </div>

      {/* Urgent Renewals Alert */}
      {urgentRenewals.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <FaExclamationTriangle className="h-5 w-5 text-red-400 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-red-800">
                {urgentRenewals.length} Renewal{urgentRenewals.length > 1 ? 's' : ''} Require{urgentRenewals.length > 1 ? '' : 's'} Immediate Attention
              </h3>
              <p className="text-sm text-red-700 mt-1">
                These policies expire within 30 days or have already expired.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Renewals Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Renewal Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Truck Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timeline
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Premium
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
              {filteredRenewals.map((renewal) => {
                const StatusIcon = getStatusIcon(renewal.status);
                return (
                  <tr key={renewal.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{renewal.id}</div>
                        <div className="text-sm text-gray-500">{renewal.insuranceCompany}</div>
                        <div className="text-sm text-gray-500">Policy: {renewal.policyId}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <FaTruck className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{renewal.truckPlate}</div>
                          <div className="text-sm text-gray-500">ID: {renewal.truckId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <FaCalendarAlt className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm text-gray-900">Expires: {renewal.currentEndDate}</div>
                          <div className="text-sm text-gray-500">Renewal: {renewal.renewalDate}</div>
                          <div className={`text-sm font-medium ${getDaysUntilRenewalColor(renewal.daysUntilRenewal)}`}>
                            {renewal.daysUntilRenewal > 0 
                              ? `${renewal.daysUntilRenewal} days left`
                              : renewal.daysUntilRenewal === 0
                              ? 'Expires today'
                              : `${Math.abs(renewal.daysUntilRenewal)} days overdue`
                            }
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm text-gray-900">
                          Current: ${renewal.currentPremium}
                        </div>
                        <div className="text-sm text-gray-500">
                          Estimated: ${renewal.estimatedPremium}
                        </div>
                        <div className="text-xs text-gray-400">
                          Auto-renew: {renewal.autoRenew ? 'Yes' : 'No'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <StatusIcon className="h-4 w-4 mr-2" />
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(renewal.status)}`}>
                          {renewal.status.charAt(0).toUpperCase() + renewal.status.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900" title="View Details">
                          <FaEye className="h-4 w-4" />
                        </button>
                        <button className="text-green-600 hover:text-green-900" title="Edit Renewal">
                          <FaEdit className="h-4 w-4" />
                        </button>
                        <button className="text-yellow-600 hover:text-yellow-900" title="Set Reminder">
                          <FaBell className="h-4 w-4" />
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
            <FaCalendarAlt className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Renewals</p>
              <p className="text-2xl font-bold text-gray-900">{renewals.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center">
            <FaExclamationTriangle className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Urgent</p>
              <p className="text-2xl font-bold text-gray-900">
                {urgentRenewals.length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center">
            <FaClock className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Upcoming</p>
              <p className="text-2xl font-bold text-gray-900">
                {upcomingRenewals.length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center">
            <FaShieldAlt className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Auto-Renew</p>
              <p className="text-2xl font-bold text-gray-900">
                {renewals.filter(r => r.autoRenew).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Renewal Calendar */}
      <div className="bg-white rounded-lg border p-6 mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Renewal Calendar</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* This Month */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">This Month</h4>
            <div className="space-y-2">
              {renewals
                .filter(r => {
                  const renewalDate = new Date(r.renewalDate);
                  const now = new Date();
                  return renewalDate.getMonth() === now.getMonth() && renewalDate.getFullYear() === now.getFullYear();
                })
                .map(renewal => (
                  <div key={renewal.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-700">{renewal.truckPlate}</span>
                    <span className={`text-xs px-2 py-1 rounded ${getStatusColor(renewal.status)}`}>
                      {renewal.daysUntilRenewal} days
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Next Month */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Next Month</h4>
            <div className="space-y-2">
              {renewals
                .filter(r => {
                  const renewalDate = new Date(r.renewalDate);
                  const nextMonth = new Date();
                  nextMonth.setMonth(nextMonth.getMonth() + 1);
                  return renewalDate.getMonth() === nextMonth.getMonth() && renewalDate.getFullYear() === nextMonth.getFullYear();
                })
                .map(renewal => (
                  <div key={renewal.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-700">{renewal.truckPlate}</span>
                    <span className={`text-xs px-2 py-1 rounded ${getStatusColor(renewal.status)}`}>
                      {renewal.daysUntilRenewal} days
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Overdue */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Overdue</h4>
            <div className="space-y-2">
              {renewals
                .filter(r => r.daysUntilRenewal < 0)
                .map(renewal => (
                  <div key={renewal.id} className="flex items-center justify-between p-2 bg-red-50 rounded">
                    <span className="text-sm text-red-700">{renewal.truckPlate}</span>
                    <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-800">
                      {Math.abs(renewal.daysUntilRenewal)} days
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Renewal Modal Placeholder */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Renewal</h3>
              <p className="text-sm text-gray-500 mb-4">Renewal creation form would go here</p>
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

export default RenewalManagement;
