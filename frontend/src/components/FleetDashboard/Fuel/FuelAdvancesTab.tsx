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

            <div className="bg-white p-6 rounded-[20px] shadow-sm border border-slate-100">
                <h3 className="text-xl font-bold mb-4">Pending Fuel Advances</h3>
                {loading ? <p>Loading advances...</p> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm mt-4">
                            <thead>
                                <tr className="bg-slate-100 text-slate-600 text-left">
                                    <th className="p-3 rounded-l-lg">Driver ID</th>
                                    <th className="p-3">Amount Requested</th>
                                    <th className="p-3">Trip ID</th>
                                    <th className="p-3">Notes</th>
                                    <th className="p-3 rounded-r-lg">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingAdvances.map(advance => (
                                    <tr key={advance.id} className="border-b hover:bg-slate-50">
                                        <td className="p-3 font-medium text-primary-600">{advance.driverId}</td>
                                        <td className="p-3 font-bold">${advance.advanceAmount?.toFixed(2)}</td>
                                        <td className="p-3 text-slate-500">{advance.tripId || 'N/A'}</td>
                                        <td className="p-3 text-slate-600">{advance.notes || 'No notes'}</td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => handleApprove(advance.id)} className="bg-emerald-100 text-emerald-600 p-2 rounded hover:bg-emerald-200" title="Approve">
                                                    <Check size={16} />
                                                </button>
                                                <button onClick={() => handleReject(advance.id)} className="bg-rose-100 text-rose-600 p-2 rounded hover:bg-rose-200" title="Reject">
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {pendingAdvances.length === 0 && (
                                    <tr><td colSpan={5} className="p-4 text-center text-slate-500">No pending advances at the moment.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
