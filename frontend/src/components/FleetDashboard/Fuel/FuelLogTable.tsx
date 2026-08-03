import React, { useMemo } from 'react';
import {
    CheckCircle2,
    AlertTriangle,
    Clock,
    Truck,
    User,
    Calendar,
    Droplets,
    ChevronRight,
    FileText,
    Navigation,
} from 'lucide-react';
import type { FuelEntry } from '../../../services/fleetApi';
import {
    StandardDataTable,
    StatusBadge,
    type Column,
    type TableAction,
} from '../../EnliteUI/Tables';

interface FuelLogTableProps {
    logs: FuelEntry[];
    loading?: boolean;
    onRowClick: (log: FuelEntry) => void;
}

const FuelLogTable: React.FC<FuelLogTableProps> = ({ logs, loading, onRowClick }) => {
    const columns: Column<FuelEntry>[] = useMemo(() => [
        {
            key: 'date',
            label: 'Date & Time',
            sortable: true,
            render: (_: any, log: FuelEntry) => (
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500">
                        <Calendar size={16} />
                    </div>
                    <div>
                        <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">
                            {new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
                            {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                </div>
            ),
        },
        {
            key: 'truckId',
            label: 'Vehicle & Driver',
            sortable: true,
            render: (_: any, log: FuelEntry) => (
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                        <Truck size={12} className="text-slate-400 dark:text-slate-500" />
                        <span className="text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">{log.truckId}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <User size={12} className="text-slate-400 dark:text-slate-500" />
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-[100px]">{log.driverId}</span>
                    </div>
                </div>
            ),
        },
        {
            key: 'jurisdiction',
            label: 'Jurisdiction',
            sortable: true,
            render: (value: string) => (
                <span className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-[0.1em]">{value}</span>
            ),
        },
        {
            key: 'fuelType',
            label: 'Type',
            sortable: true,
            render: (_: any, log: FuelEntry) => (
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                        <Droplets size={12} className={log.fuelType === 'DEF' ? 'text-blue-400' : 'text-slate-400 dark:text-slate-500'} />
                        <span className={`text-[10px] font-black uppercase tracking-tight ${log.fuelType === 'DEF' ? 'text-blue-500 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300'}`}>
                            {log.fuelType}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${log.isFullTank ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                            {log.isFullTank ? 'Full Fill-up' : 'Partial'}
                        </span>
                    </div>
                </div>
            ),
        },
        {
            key: 'gallons',
            label: 'Volume',
            sortable: true,
            align: 'right',
            render: (_: any, log: FuelEntry) => (
                <div className="inline-flex flex-col items-end">
                    <span className="text-[13px] font-black text-slate-900 dark:text-white">{log.gallons.toFixed(1)}</span>
                    <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        <Navigation size={8} /> {log.odometer?.toLocaleString()}
                    </div>
                </div>
            ),
        },
        {
            key: 'totalCost',
            label: 'Cost',
            sortable: true,
            align: 'right',
            render: (_: any, log: FuelEntry) => (
                <div className="inline-flex flex-col items-end">
                    <span className="text-[13px] font-black text-slate-900 dark:text-white">${log.totalCost.toFixed(0)}</span>
                    <span className="text-[9px] font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-widest">${log.costPerGallon.toFixed(2)}/Gal</span>
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            align: 'center',
            render: (status: string) => {
                if (status === 'verified') {
                    return <StatusBadge status="verified" label={<>Verified</>} icon={<CheckCircle2 size={10} />} />;
                }
                if (status === 'flagged') {
                    return <StatusBadge variant="error" label={<>Flagged</>} icon={<AlertTriangle size={10} />} />;
                }
                return <StatusBadge status="pending" label={<>Pending</>} icon={<Clock size={10} />} />;
            },
        },
        {
            key: 'receiptUrl',
            label: 'Report',
            align: 'right',
            hideable: false,
            render: (_: any, log: FuelEntry) => (
                <div className="flex justify-end gap-2">
                    {log.receiptUrl && (
                        <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400 rounded-xl cursor-help transition-colors" title="Receipt Attached">
                            <FileText size={16} />
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onRowClick(log);
                        }}
                        className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-xl hover:bg-slate-900 dark:hover:bg-slate-700 hover:text-white transition-all"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            ),
        },
    ], [onRowClick]);

    const rowActions: TableAction<FuelEntry>[] = useMemo(() => [
        {
            key: 'view',
            label: 'View details',
            icon: <ChevronRight size={14} />,
            onClick: (row) => onRowClick(row),
        },
    ], [onRowClick]);

    return (
        <StandardDataTable<FuelEntry>
            embedded
            columns={columns}
            data={logs}
            loading={!!loading}
            getRowId={(row) => row.id}
            onRowClick={(row) => onRowClick(row)}
            searchable
            searchPlaceholder="Search fuel logs…"
            searchKeys={['truckId', 'driverId', 'jurisdiction', 'fuelType', 'status']}
            pagination
            pageSize={10}
            columnVisibility
            stickyHeader
            striped
            hoverable
            emptyMessage="No fuel entries recorded for this period"
            rowActions={rowActions}
            ariaLabel="Fuel log table"
        />
    );
};

export default FuelLogTable;
