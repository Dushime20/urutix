import React, { useState, useEffect } from 'react';
import { fuelApi } from '../../../services/fuelApi';
import { ShieldCheck } from 'lucide-react';

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
            setOverBudgetTrips(data);
        } catch (error) {
            console.error('Failed to load budgets', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800 transition-colors">
                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500 mb-8 flex items-center gap-3">
                    <span className="w-8 h-px bg-slate-200 dark:bg-slate-800"></span>
                    Over Budget Trips
                </h3>
                {loading ? (
                    <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                        <div className="w-4 h-4 border-2 border-primary-500 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-xs font-black uppercase tracking-widest">Loading budgets...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-950/20 text-slate-400 dark:text-slate-500 text-left transition-colors border-b border-slate-100 dark:border-slate-800/50">
                                    <th className="p-6 px-8 text-[10px] font-black uppercase tracking-widest">Trip ID</th>
                                    <th className="p-6 px-8 text-[10px] font-black uppercase tracking-widest">Budgeted Amount</th>
                                    <th className="p-6 px-8 text-[10px] font-black uppercase tracking-widest">Actual Spend</th>
                                    <th className="p-6 px-8 text-[10px] font-black uppercase tracking-widest">Variance</th>
                                    <th className="p-6 px-8 text-center text-[10px] font-black uppercase tracking-widest">Status</th>
                                </tr>
                            </thead>
                             <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                {overBudgetTrips.map(trip => (
                                    <tr key={trip.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                        <td className="p-6 px-8 font-black text-[11px] text-blue-600 dark:text-blue-400 uppercase tracking-tight">{trip.tripId}</td>
                                        <td className="p-6 px-8 text-sm font-black text-slate-700 dark:text-slate-200">${trip.budgetedAmount?.toFixed(2)}</td>
                                        <td className="p-6 px-8 text-sm font-black text-slate-700 dark:text-slate-200">${trip.actualAmount?.toFixed(2)}</td>
                                        <td className="p-6 px-8">
                                            <span className="text-rose-500 dark:text-rose-400 font-black text-sm tracking-tight">-${trip.variance?.toFixed(2)}</span>
                                        </td>
                                        <td className="p-6 px-8">
                                            <div className="flex justify-center">
                                                <span className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[9px] font-black uppercase tracking-widest border border-rose-100 dark:border-rose-800/30">
                                                    Over Budget
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {overBudgetTrips.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 dark:bg-slate-950 border border-transparent dark:border-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-700 shadow-xl shadow-slate-900/5">
                                                    <ShieldCheck size={32} />
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Financial Integrity Verified</p>
                                                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest mt-1">No trips are currently exceeding their fuel budget allocation.</p>
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
