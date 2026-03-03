import React, { useState, useEffect } from 'react';
import { fuelApi } from '../../../services/fuelApi';
import { StatCard } from '../../EnliteUI/Cards/StatCard';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatCard
                    title="Active Budgets Monitored"
                    value={overBudgetTrips.length > 0 ? 'Tracking Overruns' : 'All Good'}
                    icon={<ShieldCheck size={24} />}
                    color="primary"
                />
                <StatCard
                    title="Over Budget Trips"
                    value={overBudgetTrips.length}
                    icon={<AlertTriangle size={24} />}
                    color={overBudgetTrips.length > 0 ? 'error' : 'secondary'}
                />
            </div>

            <div className="bg-white p-6 rounded-[20px] shadow-sm border border-slate-100">
                <h3 className="text-xl font-bold mb-4">Over Budget Trips</h3>
                {loading ? <p>Loading budgets...</p> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-100 text-slate-600 text-left">
                                    <th className="p-3 rounded-l-lg">Trip ID</th>
                                    <th className="p-3">Budgeted Amount</th>
                                    <th className="p-3">Actual Spend</th>
                                    <th className="p-3">Variance</th>
                                    <th className="p-3 rounded-r-lg">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {overBudgetTrips.map(trip => (
                                    <tr key={trip.id} className="border-b hover:bg-slate-50">
                                        <td className="p-3 font-medium text-primary-600">{trip.tripId}</td>
                                        <td className="p-3">${trip.budgetedAmount?.toFixed(2)}</td>
                                        <td className="p-3">${trip.actualAmount?.toFixed(2)}</td>
                                        <td className="p-3">
                                            <span className="text-rose-500 font-bold">${trip.variance?.toFixed(2)}</span>
                                        </td>
                                        <td className="p-3">
                                            <span className="px-2 py-1 rounded bg-rose-100 text-rose-700 font-medium">Over Budget</span>
                                        </td>
                                    </tr>
                                ))}
                                {overBudgetTrips.length === 0 && (
                                    <tr><td colSpan={5} className="p-4 text-center text-slate-500">No trips are currently over budget.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
