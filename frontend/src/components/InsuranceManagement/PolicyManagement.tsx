import React, { useState } from 'react';
import { FaPlus, FaEye, FaEdit, FaTrash, FaDownload, FaShieldAlt, FaTruck, FaCalendarAlt, FaDollarSign } from 'react-icons/fa';
import { StandardDataTable, StatusBadge, type Column, type TableAction } from '../EnliteUI/Tables';

interface Policy {
  id: string;
  truckId: string;
  truckPlate: string;
  insuranceCompany: string;
  policyType: string;
  coverageAmount: number;
  premium: number;
  startDate: string;
  endDate: string;
  status: string;
  deductible: number;
  coverageTypes: string[];
}

const PolicyManagement: React.FC = () => {
  const [showAddModal, setShowAddModal] = useState(false);

  const policies: Policy[] = [
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

  const statusVariant = (status: string) => {
    if (status === 'active') return 'success' as const;
    if (status === 'pending') return 'warning' as const;
    if (status === 'expired') return 'error' as const;
    return 'neutral' as const;
  };

  const columns: Column<Policy>[] = [
    {
      key: 'id',
      label: 'Policy Details',
      alwaysVisible: true,
      render: (_v, row) => (
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-slate-100">{row.id}</div>
          <div className="text-sm text-gray-500">{row.insuranceCompany}</div>
          <div className="text-sm text-gray-500">{row.policyType}</div>
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
      key: 'coverageAmount',
      label: 'Coverage',
      render: (_v, row) => (
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-slate-100">
            ${row.coverageAmount.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">Deductible: ${row.deductible}</div>
          <div className="text-xs text-gray-400">
            {row.coverageTypes.slice(0, 2).join(', ')}
            {row.coverageTypes.length > 2 && '...'}
          </div>
        </div>
      ),
    },
    {
      key: 'startDate',
      label: 'Dates',
      render: (_v, row) => (
        <div className="flex items-center">
          <FaCalendarAlt className="h-4 w-4 text-gray-400 mr-2" />
          <div>
            <div className="text-sm text-gray-900 dark:text-slate-100">{row.startDate}</div>
            <div className="text-sm text-gray-500">to {row.endDate}</div>
          </div>
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

  const rowActions: TableAction<Policy>[] = [
    {
      key: 'view',
      label: 'View',
      icon: <FaEye className="w-3.5 h-3.5" />,
      onClick: () => {},
    },
    {
      key: 'edit',
      label: 'Edit',
      icon: <FaEdit className="w-3.5 h-3.5" />,
      onClick: () => {},
    },
    {
      key: 'download',
      label: 'Download',
      icon: <FaDownload className="w-3.5 h-3.5" />,
      onClick: () => {},
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <FaTrash className="w-3.5 h-3.5" />,
      variant: 'danger',
      divider: true,
      onClick: () => {},
    },
  ];

  return (
    <div className="p-6">
      <StandardDataTable
        title="Policy Management"
        subtitle="Manage insurance policies across your fleet"
        icon={<FaShieldAlt className="w-5 h-5" />}
        headerColor="primary"
        headerActions={
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FaPlus className="mr-2" />
            Add Policy
          </button>
        }
        columns={columns}
        data={policies}
        getRowId={(row) => row.id}
        searchPlaceholder="Search policies..."
        searchKeys={['id', 'truckPlate', 'insuranceCompany', 'policyType', 'status']}
        filters={[
          {
            key: 'status',
            label: 'Status',
            options: [
              { value: 'active', label: 'Active' },
              { value: 'pending', label: 'Pending' },
              { value: 'expired', label: 'Expired' },
            ],
          },
        ]}
        rowActions={rowActions}
        emptyMessage="No policies match your current filters"
        ariaLabel="Insurance policies"
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
        <div className="bg-white dark:bg-slate-900 rounded-lg border p-6">
          <div className="flex items-center">
            <FaShieldAlt className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Policies</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{policies.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-lg border p-6">
          <div className="flex items-center">
            <FaDollarSign className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Premium</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${policies.reduce((sum, p) => sum + p.premium, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-lg border p-6">
          <div className="flex items-center">
            <FaTruck className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Insured Trucks</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {new Set(policies.map((p) => p.truckId)).size}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-lg border p-6">
          <div className="flex items-center">
            <FaCalendarAlt className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Expiring Soon</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {policies.filter((p) => p.status === 'active').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-slate-900">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Add New Policy</h3>
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
