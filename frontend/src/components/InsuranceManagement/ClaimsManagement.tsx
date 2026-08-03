import React, { useState } from 'react';
import {
  FaPlus, FaEye, FaEdit, FaDownload, FaExclamationTriangle, FaClock,
  FaCheckCircle, FaFileAlt, FaDollarSign, FaTruck,
} from 'react-icons/fa';
import { StandardDataTable, StatusBadge, type Column, type TableAction } from '../EnliteUI/Tables';

interface Claim {
  id: string;
  policyId: string;
  truckId: string;
  truckPlate: string;
  claimType: string;
  description: string;
  incidentDate: string;
  reportedDate: string;
  estimatedAmount: number;
  approvedAmount: number;
  status: string;
  adjuster: string;
  notes: string;
  documents: string[];
}

const ClaimsManagement: React.FC = () => {
  const [showAddModal, setShowAddModal] = useState(false);

  const claims: Claim[] = [
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

  const statusVariant = (status: string) => {
    if (status === 'approved') return 'success' as const;
    if (status === 'pending') return 'warning' as const;
    if (status === 'investigating') return 'info' as const;
    if (status === 'closed') return 'neutral' as const;
    if (status === 'denied') return 'error' as const;
    return 'neutral' as const;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'closed':
        return FaCheckCircle;
      case 'investigating':
        return FaExclamationTriangle;
      case 'pending':
      default:
        return FaClock;
    }
  };

  const columns: Column<Claim>[] = [
    {
      key: 'id',
      label: 'Claim Details',
      alwaysVisible: true,
      render: (_v, row) => (
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-slate-100">{row.id}</div>
          <div className="text-sm text-gray-500">Policy: {row.policyId}</div>
          <div className="text-sm text-gray-500">{row.claimType}</div>
        </div>
      ),
    },
    {
      key: 'truckPlate',
      label: 'Truck Info',
      render: (_v, row) => (
        <div className="flex items-center">
          <FaTruck className="h-4 w-4 text-gray-400 mr-2" />
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-slate-100">{row.truckPlate}</div>
            <div className="text-sm text-gray-500">ID: {row.truckId}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'incidentDate',
      label: 'Incident',
      render: (_v, row) => (
        <div>
          <div className="text-sm text-gray-900 dark:text-slate-100">{row.incidentDate}</div>
          <div className="text-sm text-gray-500">Reported: {row.reportedDate}</div>
          <div className="text-xs text-gray-400 truncate max-w-xs">{row.description}</div>
        </div>
      ),
    },
    {
      key: 'estimatedAmount',
      label: 'Financial',
      render: (_v, row) => (
        <div>
          <div className="text-sm text-gray-900 dark:text-slate-100">
            Est: ${row.estimatedAmount.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">
            Approved: ${row.approvedAmount.toLocaleString()}
          </div>
          <div className="text-xs text-gray-400">Adjuster: {row.adjuster}</div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_v, row) => (
        <StatusBadge
          status={row.status}
          variant={statusVariant(row.status)}
          label={row.status.charAt(0).toUpperCase() + row.status.slice(1)}
        />
      ),
    },
  ];

  const rowActions: TableAction<Claim>[] = [
    {
      key: 'view',
      label: 'View Details',
      icon: <FaEye className="w-3.5 h-3.5" />,
      onClick: () => {},
    },
    {
      key: 'edit',
      label: 'Edit Claim',
      icon: <FaEdit className="w-3.5 h-3.5" />,
      onClick: () => {},
    },
    {
      key: 'documents',
      label: 'Documents',
      icon: <FaFileAlt className="w-3.5 h-3.5" />,
      onClick: () => {},
    },
    {
      key: 'download',
      label: 'Download',
      icon: <FaDownload className="w-3.5 h-3.5" />,
      onClick: () => {},
    },
  ];

  return (
    <div className="p-6">
      <StandardDataTable
        title="Claims Management"
        subtitle="Track and manage insurance claims"
        icon={<FaExclamationTriangle className="w-5 h-5" />}
        headerColor="warning"
        headerActions={
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FaPlus className="mr-2" />
            File Claim
          </button>
        }
        columns={columns}
        data={claims}
        getRowId={(row) => row.id}
        searchPlaceholder="Search claims..."
        searchKeys={['id', 'truckPlate', 'claimType', 'policyId', 'status', 'adjuster']}
        filters={[
          {
            key: 'status',
            label: 'Status',
            options: [
              { value: 'pending', label: 'Pending' },
              { value: 'investigating', label: 'Investigating' },
              { value: 'approved', label: 'Approved' },
              { value: 'closed', label: 'Closed' },
              { value: 'denied', label: 'Denied' },
            ],
          },
        ]}
        rowActions={rowActions}
        emptyMessage="No claims match your current filters"
        ariaLabel="Insurance claims"
      />

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
                {claims.filter((c) => c.status === 'pending').length}
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
                {claims.filter((c) => c.status === 'closed').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-6 mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Claim Activity</h3>
        <div className="space-y-4">
          {claims.slice(0, 3).map((claim) => {
            const StatusIcon = getStatusIcon(claim.status);
            return (
              <div key={claim.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  <div className="p-2 rounded-full bg-slate-100">
                    <StatusIcon className="h-4 w-4" />
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
            );
          })}
        </div>
      </div>

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
