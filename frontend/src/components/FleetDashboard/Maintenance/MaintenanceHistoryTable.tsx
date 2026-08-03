import React, { useMemo } from 'react';
import { FaEye, FaEdit, FaTrash, FaCheck, FaClock, FaTools } from 'react-icons/fa';
import {
    StandardDataTable,
    StatusBadge,
    type Column,
    type TableAction,
} from '../../EnliteUI/Tables';

interface MaintenanceRecord {
    id: string;
    truckId: string;
    plateNumber?: string;
    type: string;
    title: string;
    description: string;
    date: string;
    cost: number;
    status: string;
    vendor?: string;
}

interface MaintenanceHistoryTableProps {
    records: MaintenanceRecord[];
    loading?: boolean;
    onView: (record: MaintenanceRecord) => void;
    onEdit: (record: MaintenanceRecord) => void;
    onDelete: (id: string) => void;
}

const MaintenanceHistoryTable: React.FC<MaintenanceHistoryTableProps> = ({
    records,
    loading,
    onView,
    onEdit,
    onDelete,
}) => {
    const getStatusBadge = (status: string) => {
        const s = status?.toUpperCase();
        if (s === 'COMPLETED' || s === 'DONE') {
            return <StatusBadge status="completed" label="Completed" icon={<FaCheck className="w-2.5 h-2.5" />} />;
        }
        if (s === 'SCHEDULED' || s === 'PENDING') {
            return <StatusBadge status="scheduled" label="Scheduled" icon={<FaClock className="w-2.5 h-2.5" />} />;
        }
        if (s === 'IN_PROGRESS' || s === 'REPAIRING') {
            return <StatusBadge status="in_progress" label="In Progress" icon={<FaTools className="w-2.5 h-2.5" />} />;
        }
        if (s === 'FAULT_REPORT' || s === 'FAULT') {
            return <StatusBadge variant="error" label="Fault Report" icon={<FaTools className="w-2.5 h-2.5" />} />;
        }
        return <StatusBadge status={status} label={status} />;
    };

    const columns: Column<MaintenanceRecord>[] = useMemo(() => [
        {
            key: 'date',
            label: 'Date',
            sortable: true,
            render: (value: string) => new Date(value).toLocaleDateString(),
        },
        {
            key: 'plateNumber',
            label: 'Vehicle',
            sortable: true,
            render: (_: any, record: MaintenanceRecord) => (
                <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-slate-100">{record.plateNumber || 'N/A'}</div>
                    <div className="text-xs text-gray-500 dark:text-slate-400">ID: {record.truckId?.substring(0, 8)}</div>
                </div>
            ),
        },
        {
            key: 'title',
            label: 'Service',
            sortable: true,
            render: (_: any, record: MaintenanceRecord) => (
                <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-slate-100">{record.title}</div>
                    <div className="text-xs text-gray-500 dark:text-slate-400">{record.type}</div>
                </div>
            ),
        },
        {
            key: 'vendor',
            label: 'Provider',
            sortable: true,
            render: (_: any, record: MaintenanceRecord) =>
                record.vendor || record.description?.match(/Vendor: (.*)\)/)?.[1] || '-',
        },
        {
            key: 'cost',
            label: 'Cost',
            sortable: true,
            render: (value: number) => `$${value?.toLocaleString() ?? '0.00'}`,
        },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            render: (value: string) => getStatusBadge(value),
        },
    ], []);

    const rowActions: TableAction<MaintenanceRecord>[] = useMemo(() => [
        {
            key: 'view',
            label: 'View details',
            icon: <FaEye className="w-3.5 h-3.5" />,
            onClick: (row) => onView(row),
        },
        {
            key: 'edit',
            label: 'Edit',
            icon: <FaEdit className="w-3.5 h-3.5" />,
            onClick: (row) => onEdit(row),
        },
        {
            key: 'delete',
            label: 'Delete',
            icon: <FaTrash className="w-3.5 h-3.5" />,
            variant: 'danger',
            onClick: (row) => onDelete(row.id),
            divider: true,
        },
    ], [onView, onEdit, onDelete]);

    return (
        <StandardDataTable<MaintenanceRecord>
            title="Maintenance History"
            icon={<FaTools className="w-4 h-4" />}
            columns={columns}
            data={records}
            loading={!!loading}
            getRowId={(row) => row.id}
            searchable
            searchPlaceholder="Search maintenance…"
            searchKeys={['title', 'type', 'plateNumber', 'truckId', 'vendor', 'status', 'description']}
            pagination
            pageSize={10}
            columnVisibility
            stickyHeader
            striped
            hoverable
            emptyMessage="No maintenance records found. Get started by scheduling a new service."
            rowActions={rowActions}
            ariaLabel="Maintenance history"
        />
    );
};

export default MaintenanceHistoryTable;
