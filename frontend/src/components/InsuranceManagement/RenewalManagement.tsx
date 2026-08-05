import React, { useState } from 'react';
import {
  FaPlus, FaEye, FaEdit, FaDownload, FaCalendarAlt, FaClock,
  FaExclamationTriangle, FaBell, FaShieldAlt, FaTruck, FaTimesCircle,
} from 'react-icons/fa';
import { StandardDataTable, StatusBadge, type Column, type TableAction } from '../EnliteUI/Tables';

interface Renewal {
  id: string;
  policyId: string;
  truckId: string;
  truckPlate: string;
  insuranceCompany: string;
  currentEndDate: string;
  renewalDate: string;
  daysUntilRenewal: number;
  estimatedPremium: number;
  currentPremium: number;
  status: string;
  autoRenew: boolean;
  coverageChanges: string[];
  notes: string;
}

const RenewalManagement: React.FC = () => {
  const [showAddModal, setShowAddModal] = useState(false);

  const renewals: Renewal[] = [
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

  const statusVariant = (status: string) => {
    if (status === 'urgent') return 'error' as const;
    if (status === 'upcoming') return 'warning' as const;
    if (status === 'completed') return 'success' as const;
    if (status === 'expired') return 'neutral' as const;
    return 'neutral' as const;
  };

  const getDaysUntilRenewalColor = (days: number) => {
    if (days < 0) return 'text-red-600';
    if (days <= 30) return 'text-red-600';
    if (days <= 60) return 'text-yellow-600';
    return 'text-green-600';
  };

  const urgentRenewals = renewals.filter((r) => r.status === 'urgent' || r.daysUntilRenewal <= 30);
  const upcomingRenewals = renewals.filter((r) => r.status === 'upcoming' && r.daysUntilRenewal > 30);

  const columns: Column<Renewal>[] = [
    {
      key: 'id',
      label: 'Renewal Details',
      alwaysVisible: true,
      render: (_v, row) => (
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-slate-100">{row.id}</div>
          <div className="text-sm text-gray-500">{row.insuranceCompany}</div>
          <div className="text-sm text-gray-500">Policy: {row.policyId}</div>
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
      key: 'daysUntilRenewal',
      label: 'Timeline',
      render: (_v, row) => (
        <div className="flex items-center">
          <FaCalendarAlt className="h-4 w-4 text-gray-400 mr-2" />
          <div>
            <div className="text-sm text-gray-900 dark:text-slate-100">Expires: {row.currentEndDate}</div>
            <div className="text-sm text-gray-500">Renewal: {row.renewalDate}</div>
            <div className={`text-sm font-medium ${getDaysUntilRenewalColor(row.daysUntilRenewal)}`}>
              {row.daysUntilRenewal > 0
                ? `${row.daysUntilRenewal} days left`
                : row.daysUntilRenewal === 0
                  ? 'Expires today'
                  : `${Math.abs(row.daysUntilRenewal)} days overdue`}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'currentPremium',
      label: 'Premium',
      render: (_v, row) => (
        <div>
          <div className="text-sm text-gray-900 dark:text-slate-100">Current: ${row.currentPremium}</div>
          <div className="text-sm text-gray-500">Estimated: ${row.estimatedPremium}</div>
          <div className="text-xs text-gray-400">Auto-renew: {row.autoRenew ? 'Yes' : 'No'}</div>
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

  const rowActions: TableAction<Renewal>[] = [
    {
      key: 'view',
      label: 'View Details',
      icon: <FaEye className="w-3.5 h-3.5" />,
      onClick: () => {},
    },
    {
      key: 'edit',
      label: 'Edit Renewal',
      icon: <FaEdit className="w-3.5 h-3.5" />,
      onClick: () => {},
    },
    {
      key: 'reminder',
      label: 'Set Reminder',
      icon: <FaBell className="w-3.5 h-3.5" />,
      variant: 'warning',
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
      {urgentRenewals.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <FaExclamationTriangle className="h-5 w-5 text-red-400 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-red-800">
                {urgentRenewals.length} Renewal{urgentRenewals.length > 1 ? 's' : ''} Require
                {urgentRenewals.length > 1 ? '' : 's'} Immediate Attention
              </h3>
              <p className="text-sm text-red-700 mt-1">
                These policies expire within 30 days or have already expired.
              </p>
            </div>
          </div>
        </div>
      )}

      <StandardDataTable
        title="Renewal Management"
        subtitle="Track upcoming and overdue policy renewals"
        icon={<FaCalendarAlt className="w-5 h-5" />}
        headerColor="warning"
        headerActions={
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FaPlus className="mr-2" />
            Add Renewal
          </button>
        }
        columns={columns}
        data={renewals}
        getRowId={(row) => row.id}
        searchPlaceholder="Search renewals..."
        searchKeys={['id', 'truckPlate', 'insuranceCompany', 'policyId', 'status']}
        filters={[
          {
            key: 'status',
            label: 'Status',
            options: [
              { value: 'urgent', label: 'Urgent' },
              { value: 'upcoming', label: 'Upcoming' },
              { value: 'completed', label: 'Completed' },
              { value: 'expired', label: 'Expired' },
            ],
          },
        ]}
        rowActions={rowActions}
        emptyMessage="No renewals match your current filters"
        ariaLabel="Policy renewals"
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
        <div className="bg-white dark:bg-slate-900 rounded-lg border p-6">
          <div className="flex items-center">
            <FaCalendarAlt className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Renewals</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{renewals.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-lg border p-6">
          <div className="flex items-center">
            <FaExclamationTriangle className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Urgent</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{urgentRenewals.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-lg border p-6">
          <div className="flex items-center">
            <FaClock className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Upcoming</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{upcomingRenewals.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-lg border p-6">
          <div className="flex items-center">
            <FaShieldAlt className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Auto-Renew</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {renewals.filter((r) => r.autoRenew).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-lg border p-6 mt-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Renewal Calendar</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">This Month</h4>
            <div className="space-y-2">
              {renewals
                .filter((r) => {
                  const renewalDate = new Date(r.renewalDate);
                  const now = new Date();
                  return (
                    renewalDate.getMonth() === now.getMonth() &&
                    renewalDate.getFullYear() === now.getFullYear()
                  );
                })
                .map((renewal) => (
                  <div key={renewal.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-slate-800/50 rounded">
                    <span className="text-sm text-gray-700 dark:text-slate-300">{renewal.truckPlate}</span>
                    <StatusBadge
                      status={renewal.status}
                      variant={statusVariant(renewal.status)}
                      label={`${renewal.daysUntilRenewal} days`}
                    />
                  </div>
                ))}
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Next Month</h4>
            <div className="space-y-2">
              {renewals
                .filter((r) => {
                  const renewalDate = new Date(r.renewalDate);
                  const nextMonth = new Date();
                  nextMonth.setMonth(nextMonth.getMonth() + 1);
                  return (
                    renewalDate.getMonth() === nextMonth.getMonth() &&
                    renewalDate.getFullYear() === nextMonth.getFullYear()
                  );
                })
                .map((renewal) => (
                  <div key={renewal.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-slate-800/50 rounded">
                    <span className="text-sm text-gray-700 dark:text-slate-300">{renewal.truckPlate}</span>
                    <StatusBadge
                      status={renewal.status}
                      variant={statusVariant(renewal.status)}
                      label={`${renewal.daysUntilRenewal} days`}
                    />
                  </div>
                ))}
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Overdue</h4>
            <div className="space-y-2">
              {renewals
                .filter((r) => r.daysUntilRenewal < 0)
                .map((renewal) => (
                  <div key={renewal.id} className="flex items-center justify-between p-2 bg-red-50 rounded">
                    <span className="text-sm text-red-700">{renewal.truckPlate}</span>
                    <StatusBadge
                      variant="error"
                      label={`${Math.abs(renewal.daysUntilRenewal)} days`}
                      icon={<FaTimesCircle className="w-3 h-3" />}
                    />
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-slate-900">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Add New Renewal</h3>
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
