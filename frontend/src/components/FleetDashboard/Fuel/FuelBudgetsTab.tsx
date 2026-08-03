import React, { useState, useEffect } from 'react';
import { fuelApi } from '../../../services/fuelApi';
import { ShieldCheck } from 'lucide-react';
import { StandardDataTable, StatusBadge, type Column } from '../../EnliteUI/Tables';

export const FuelBudgetsTab: React.FC = () => {
    const [overBudgetTrips, setOverBudgetTrips] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadOverBudgetTrips();
    }, []);

    const loadOverBudgetTrips = async () => {
        setLoading(true);
        try {
            const data = await fuelApi.getOverBudgetTrips();
            setOverBudgetTrips(data || []);
        } catch (error) {
            console.error('Failed to load budgets', error);
        } finally {
            setLoading(false);
        }
    };

    const columns: Column<any>[] = [
        {
            key: 'tripId',
            label: 'Trip ID',
            sortable: true,
            render: (id: string) => (
                <span className="font-black text-[11px] text-blue-600 dark:text-blue-400 uppercase tracking-tight">{id}</span>
            ),
        },
        {
            key: 'budgetedAmount',
            label: 'Budgeted Amount',
            sortable: true,
            render: (v: number) => (
                <span className="text-sm font-black text-slate-700 dark:text-slate-200">${Number(v || 0).toFixed(2)}</span>
            ),
        },
        {
            key: 'actualAmount',
            label: 'Actual Spend',
            sortable: true,
            render: (v: number) => (
                <span className="text-sm font-black text-slate-700 dark:text-slate-200">${Number(v || 0).toFixed(2)}</span>
            ),
        },
        {
            key: 'variance',
            label: 'Variance',
            sortable: true,
            render: (v: number) => (
                <span className="text-rose-500 dark:text-rose-400 font-black text-sm tracking-tight">
                    -${Number(v || 0).toFixed(2)}
                </span>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            align: 'center',
            render: () => <StatusBadge label="Over Budget" variant="error" />,
        },
    ];

    return (
        <div className="space-y-6">
            <StandardDataTable
                title="Over Budget Trips"
                icon={<ShieldCheck className="w-5 h-5" />}
                headerColor="primary"
                columns={columns}
                data={overBudgetTrips}
                loading={loading}
                getRowId={(row, i) => row.id || String(i)}
                searchable
                searchPlaceholder="Search trips…"
                searchKeys={['tripId']}
                pagination
                pageSize={10}
                columnVisibility
                stickyHeader
                striped
                hoverable
                onRefresh={loadOverBudgetTrips}
                emptyMessage="No trips are currently exceeding their fuel budget allocation"
                ariaLabel="Over budget trips"
            />
        </div>
    );
};
