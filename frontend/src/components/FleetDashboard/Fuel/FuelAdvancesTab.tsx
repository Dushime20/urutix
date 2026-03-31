import React, { useState, useEffect } from 'react';
import { fuelApi } from '../../../services/fuelApi';
import { StatCard } from '../../EnliteUI/Cards/StatCard';
import { DollarSign, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

export const FuelAdvancesTab: React.FC = () => {
    const [pendingAdvances, setPendingAdvances] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [advances, advanceStats] = await Promise.all([
                fuelApi.getPendingAdvances(),
                fuelApi.getAdvanceStats()
            ]);
            setPendingAdvances(advances);
            setStats(advanceStats);
        } catch (error) {
            console.error('Failed to load advances', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: string) => {
        try {
            await fuelApi.approveAdvance(id);
            toast.success('Advance approved');
            loadData();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to approve advance');
        }
    };

    const handleReject = async (id: string) => {
        const reason = window.prompt("Rejection reason (optional)");
        try {
            await fuelApi.rejectAdvance(id, reason || 'Rejected by Admin');
            toast.success('Advance rejected');
            loadData();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to reject advance');
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Total Advances"
                    value={stats?.totalAdvances || 0}
                    icon={<DollarSign size={24} />}
                    color="primary"
                />
                <StatCard
                    title="Pending Value"
                    value={`$${stats?.pendingAmount?.toLocaleString() || '0.00'}`}
                    icon={<DollarSign size={24} />}
                    color="accent"
                />
                <StatCard
                    title="Unreconciled Balance"
                    value={`$${((stats?.totalAdvanced || 0) - (stats?.totalReconciled || 0)).toLocaleString()}`}
                    icon={<DollarSign size={24} />}
                    color="error"
                />
            </div>

            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800 transition-colors">
                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500 mb-8 flex items-center gap-3">
                    <span className="w-8 h-px bg-slate-200 dark:bg-slate-800"></span>
                    Pending Fuel Advances
                </h3>
                {loading ? (
                    <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                        <div className="w-4 h-4 border-2 border-primary-500 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-xs font-black uppercase tracking-widest">Loading advances...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800/50 text-slate-400 dark:text-slate-500 text-left transition-colors">
                                    <th className="p-6 px-8 text-[10px] font-black uppercase tracking-widest">Driver ID</th>
                                    <th className="p-6 px-8 text-[10px] font-black uppercase tracking-widest">Amount Requested</th>
                                    <th className="p-6 px-8 text-[10px] font-black uppercase tracking-widest">Trip ID</th>
                                    <th className="p-6 px-8 text-[10px] font-black uppercase tracking-widest">Notes</th>
                                    <th className="p-6 px-8 text-center text-[10px] font-black uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                {pendingAdvances.map(advance => (
                                    <tr key={advance.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                        <td className="p-6 px-8 font-black text-[11px] text-blue-600 dark:text-blue-400 uppercase tracking-tight">{advance.driverId}</td>
                                        <td className="p-6 px-8 text-sm font-black text-slate-900 dark:text-white">${advance.advanceAmount?.toFixed(2)}</td>
                                        <td className="p-6 px-8 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-tight">{advance.tripId || 'N/A'}</td>
                                        <td className="p-6 px-8 text-xs font-medium text-slate-600 dark:text-slate-400">{advance.notes || 'No notes'}</td>
                                        <td className="p-6 px-8">
                                            <div className="flex items-center justify-center gap-2">
                                                <button 
                                                    onClick={() => handleApprove(advance.id)} 
                                                    className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-3 rounded-xl border border-emerald-100 dark:border-emerald-800/30 hover:bg-emerald-100 dark:hover:bg-emerald-800/50 transition-all active:scale-95" 
                                                    title="Approve"
                                                >
                                                    <Check size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleReject(advance.id)} 
                                                    className="bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 p-3 rounded-xl border border-rose-100 dark:border-rose-800/30 hover:bg-rose-100 dark:hover:bg-rose-800/50 transition-all active:scale-95" 
                                                    title="Reject"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {pendingAdvances.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 dark:bg-slate-950 border border-transparent dark:border-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-700 shadow-xl shadow-slate-900/5">
                                                    <Check size={32} />
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Queue Fully Reconciled</p>
                                                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest mt-1">There are no pending fuel advance requests requiring administrative review.</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
