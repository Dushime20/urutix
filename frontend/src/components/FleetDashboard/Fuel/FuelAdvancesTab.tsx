import React, { useState, useEffect } from 'react';
import { fuelApi } from '../../../services/fuelApi';
import { useAuth } from '../../../contexts/AuthContext';
import { Check, X, Clock, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCurrencyFormat } from '../../../hooks/useCurrencyFormat';

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

    return (
        <div className="space-y-6">
            {/* Table */}
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                            Pending Advance Requests
                        </h3>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                            {isAdminRole ? 'All tenant drivers' : 'Your drivers only'}
                        </p>
                    </div>
                    <span className="px-3 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-[9px] font-black uppercase tracking-widest rounded-lg border border-amber-100 dark:border-amber-800/30 flex items-center gap-1.5">
                        <Clock size={10} /> {pendingAdvances.length} Pending
                    </span>
                </div>

                {loading ? (
                    <div className="flex items-center gap-3 p-12 text-slate-400">
                        <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-xs font-black uppercase tracking-widest">Loading...</p>
                    </div>
                ) : pendingAdvances.length === 0 ? (
                    <div className="p-20 text-center flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-300 dark:text-slate-600">
                            <Check size={32} />
                        </div>
                        <div>
                            <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest">All Clear</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">No pending advance requests from your drivers</p>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800/50 text-left">
                                    <th className="p-5 px-8 text-[9px] font-black uppercase tracking-widest text-slate-400">Driver</th>
                                    <th className="p-5 px-8 text-[9px] font-black uppercase tracking-widest text-slate-400">Amount</th>
                                    <th className="p-5 px-8 text-[9px] font-black uppercase tracking-widest text-slate-400">Linked Trip</th>
                                    <th className="p-5 px-8 text-[9px] font-black uppercase tracking-widest text-slate-400">Date</th>
                                    <th className="p-5 px-8 text-[9px] font-black uppercase tracking-widest text-slate-400">Notes</th>
                                    <th className="p-5 px-8 text-center text-[9px] font-black uppercase tracking-widest text-slate-400">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                {pendingAdvances.map(advance => {
                                    const driverName = advance.driver
                                        ? `${advance.driver.firstName} ${advance.driver.lastName}`
                                        : advance.driverId?.slice(0, 8);
                                    const tripRef = advance.trip?.tripNumber || (advance.tripId ? advance.tripId.slice(0, 8) : 'N/A');

                                    return (
                                        <tr key={advance.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="p-5 px-8">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                                        <User size={14} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{driverName}</p>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{advance.driver?.email || ''}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-5 px-8">
                                                <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                                                    {formatCurrency(advance.advanceAmount)}
                                                </span>
                                            </td>
                                            <td className="p-5 px-8 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                                                {tripRef}
                                            </td>
                                            <td className="p-5 px-8 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                                {new Date(advance.advanceDate).toLocaleDateString()}
                                            </td>
                                            <td className="p-5 px-8 text-[10px] font-medium text-slate-500 dark:text-slate-400 max-w-[160px] truncate">
                                                {advance.notes || '—'}
                                            </td>
                                            <td className="p-5 px-8">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleApprove(advance.id)}
                                                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-800/30 hover:bg-emerald-100 dark:hover:bg-emerald-800/50 transition-all active:scale-95 text-[9px] font-black uppercase tracking-widest"
                                                    >
                                                        <Check size={13} /> Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(advance.id)}
                                                        className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-100 dark:border-rose-800/30 hover:bg-rose-100 dark:hover:bg-rose-800/50 transition-all active:scale-95 text-[9px] font-black uppercase tracking-widest"
                                                    >
                                                        <X size={13} /> Reject
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
