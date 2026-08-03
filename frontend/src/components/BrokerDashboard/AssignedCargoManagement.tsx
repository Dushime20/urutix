import React from 'react';
import { Package, MapPin } from 'lucide-react';
import { formatLocation } from '../../utils/formatLocation';
import { StandardDataTable, StatusBadge, type Column, type TableAction } from '../EnliteUI/Tables';

interface Cargo {
  id: string;
  title: string;
  status: string;
  origin: string | Record<string, unknown>;
  destination: string | Record<string, unknown>;
  date: string;
}

interface AssignedCargoManagementProps {
  cargos: Cargo[];
}

export const AssignedCargoManagement: React.FC<AssignedCargoManagementProps> = ({ cargos }) => {
  const columns: Column<Cargo>[] = [
    {
      key: 'title',
      label: 'Cargo ID / Title',
      sortable: true,
      render: (title, cargo) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{title}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{cargo.id}</div>
        </div>
      ),
    },
    {
      key: 'origin',
      label: 'Route',
      render: (_origin, cargo) => (
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-center">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <div className="w-0.5 h-4 bg-gray-200 dark:bg-gray-700" />
            <div className="w-2 h-2 rounded-full border-2 border-emerald-500" />
          </div>
          <div className="flex flex-col gap-1 text-xs">
            <span className="text-gray-900 dark:text-gray-300 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-blue-500" />
              {formatLocation(cargo.origin, '—')}
            </span>
            <span className="text-gray-900 dark:text-gray-300 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-emerald-500" />
              {formatLocation(cargo.destination, '—')}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      sortable: true,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (status: string) => <StatusBadge label={status} status={status} />,
    },
  ];

  const rowActions: TableAction<Cargo>[] = [
    {
      key: 'view',
      label: 'View Details',
      onClick: () => {
        /* placeholder — parent may wire later */
      },
    },
  ];

  return (
    <StandardDataTable
      title="Assigned Cargo"
      subtitle="Manage cargo assigned to you by owners"
      icon={<Package className="w-5 h-5" />}
      headerColor="primary"
      columns={columns}
      data={cargos}
      getRowId={(row) => row.id}
      searchable
      searchPlaceholder="Search cargo…"
      searchKeys={['title', 'id', 'status']}
      pagination
      pageSize={10}
      columnVisibility
      stickyHeader
      striped
      hoverable
      rowActions={rowActions}
      emptyMessage="No assigned cargo found"
      ariaLabel="Assigned cargo"
    />
  );
};
