import React, { useState, useEffect } from 'react';
import { fuelApi } from '../../../services/fuelApi';
import { useAuth } from '../../../contexts/AuthContext';
import { Check, X, Clock, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCurrencyFormat } from '../../../hooks/useCurrencyFormat';
import { StandardDataTable, type Column } from '../../EnliteUI/Tables';

export const FuelAdvancesTab: React.FC = () => {
    const { user } = useAuth();
    const { compact: formatCurrency } = useCurrencyFormat();
    const [pendingAdvances, setPendingAdvances] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Truck owners see only their drivers' advances; admins/fleet managers see all
    const isAdminRole = ['SUPER_ADMIN', 'ADMIN', 'TENANT_ADMIN', 'FLEET_MANAGER', 'FLEET_ACCOUNTANT'].includes(user?.role || '');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const advances = isAdminRole
                ? await fuelApi.getPendingAdvances()
                : await fuelApi.getPendingAdvancesForMyDrivers();
            setPendingAdvances(advances || []);
        } catch (error) {
            console.error('Failed to load advances', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: string) => {
        try {
            await fuelApi.approveAdvance(id);
            toast.success('Advance approved — driver wallet credited');
            loadData();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to approve advance');
        }
    };

    const handleReject = async (id: string) => {
        const reason = window.prompt('Rejection reason (optional)');
        if (reason === null) return; // cancelled
        try {
            await fuelApi.rejectAdvance(id, reason || 'Rejected');
            toast.success('Advance rejected');
            loadData();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to reject advance');
        }
    };

    const columns: Column<any>[] = [
        {
            key: 'driver',
            label: 'Driver',
            sortable: true,
            render: (_: any, advance) => {
                const driverName = advance.driver
                    ? `${advance.driver.firstName} ${advance.driver.lastName}`
                    : advance.driverId?.slice(0, 8);
                return (
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <User size={14} />
                        </div>
                        <div>
                            <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{driverName}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{advance.driver?.email || ''}</p>
                        </div>
                    </div>
                );
            },
        },
        {
            key: 'advanceAmount',
            label: 'Amount',
            sortable: true,
            render: (amount: number) => (
                <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(amount)}
                </span>
            ),
        },
        {
            key: 'tripId',
            label: 'Linked Trip',
            render: (_: any, advance) => (
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                    {advance.trip?.tripNumber || (advance.tripId ? advance.tripId.slice(0, 8) : 'N/A')}
                </span>
            ),
        },
        {
            key: 'advanceDate',
            label: 'Date',
            sortable: true,
            render: (date: string) => (
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    {new Date(date).toLocaleDateString()}
                </span>
            ),
        },
        {
            key: 'notes',
            label: 'Notes',
            render: (notes: string) => (
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 max-w-[160px] truncate block">
                    {notes || '—'}
                </span>
            ),
        },
        {
            key: 'actions',
            label: 'Action',
            align: 'center',
            alwaysVisible: true,
            hideable: false,
            render: (_: any, advance) => (
                <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                        type="button"
                        onClick={() => handleApprove(advance.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-100 dark:border-emerald-800/30 hover:bg-emerald-100 dark:hover:bg-emerald-800/50 transition-all text-[9px] font-black uppercase tracking-widest"
                    >
                        <Check size={13} /> Approve
                    </button>
                    <button
                        type="button"
                        onClick={() => handleReject(advance.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg border border-rose-100 dark:border-rose-800/30 hover:bg-rose-100 dark:hover:bg-rose-800/50 transition-all text-[9px] font-black uppercase tracking-widest"
                    >
                        <X size={13} /> Reject
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <StandardDataTable
                title="Pending Advance Requests"
                subtitle={isAdminRole ? 'All tenant drivers' : 'Your drivers only'}
                icon={<Clock className="w-5 h-5" />}
                headerColor="primary"
                headerActions={
                    <span className="px-3 py-1 bg-white/20 text-white text-[9px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1.5">
                        <Clock size={10} /> {pendingAdvances.length} Pending
                    </span>
                }
                columns={columns}
                data={pendingAdvances}
                loading={loading}
                getRowId={(row) => row.id}
                searchable
                searchPlaceholder="Search advances…"
                searchKeys={['notes', 'driverId', 'tripId']}
                pagination
                pageSize={10}
                columnVisibility
                stickyHeader
                striped
                hoverable
                onRefresh={loadData}
                emptyMessage="No pending advance requests from your drivers"
                ariaLabel="Pending fuel advances"
            />
        </div>
    );
};
