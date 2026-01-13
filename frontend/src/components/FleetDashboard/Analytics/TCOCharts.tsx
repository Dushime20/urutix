import React from 'react';
import { type TCOAnalysis } from '../../../services/fleetApi';

interface TCOChartsProps {
    data: TCOAnalysis;
}

const TCOCharts: React.FC<TCOChartsProps> = ({ data }) => {
    // Simple SVG Donut Chart for Cost Breakdown
    const total = data.totalCost;
    const fuelP = (data.breakdown.fuel / total) * 100;
    const maintP = (data.breakdown.maintenance / total) * 100;
    const fixedP = (data.breakdown.fixed / total) * 100;
    const laborP = (data.breakdown.labor / total) * 100;

    // Calculate Dash Arrays (circumference ~ 251.2 for r=40)
    const c = 251.2;
    const fuelDash = (fuelP / 100) * c;
    const maintDash = (maintP / 100) * c;
    const fixedDash = (fixedP / 100) * c;
    const laborDash = (laborP / 100) * c;

    // Offsets
    const maintOffset = -fuelDash;
    const fixedOffset = -(fuelDash + maintDash);
    const laborOffset = -(fuelDash + maintDash + fixedDash);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">

            {/* Cost Composition Chart */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center">
                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6 self-start w-full border-b pb-2">Cost Composition</h4>

                <div className="relative w-48 h-48">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        {/* Fuel (Blue) */}
                        <circle cx="50" cy="50" fill="transparent" r="40" stroke="#3b82f6" strokeWidth="20" strokeDasharray={`${fuelDash} ${c}`} />
                        {/* Maint (Orange) */}
                        <circle cx="50" cy="50" fill="transparent" r="40" stroke="#f97316" strokeWidth="20" strokeDasharray={`${maintDash} ${c}`} strokeDashoffset={maintOffset} />
                        {/* Fixed (Slate) */}
                        <circle cx="50" cy="50" fill="transparent" r="40" stroke="#64748b" strokeWidth="20" strokeDasharray={`${fixedDash} ${c}`} strokeDashoffset={fixedOffset} />
                        {/* Labor (Emerald) */}
                        <circle cx="50" cy="50" fill="transparent" r="40" stroke="#10b981" strokeWidth="20" strokeDasharray={`${laborDash} ${c}`} strokeDashoffset={laborOffset} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-black text-slate-900">${(data.totalCost / 1000).toFixed(1)}k</span>
                        <span className="text-xs font-bold text-slate-500">TOTAL</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-8 w-full max-w-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <div className="flex flex-col">
                            <span className="text-xs text-slate-500 font-medium">Fuel</span>
                            <span className="text-sm font-bold">{Math.round(fuelP)}%</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                        <div className="flex flex-col">
                            <span className="text-xs text-slate-500 font-medium">Maint.</span>
                            <span className="text-sm font-bold">{Math.round(maintP)}%</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-slate-500"></div>
                        <div className="flex flex-col">
                            <span className="text-xs text-slate-500 font-medium">Fixed</span>
                            <span className="text-sm font-bold">{Math.round(fixedP)}%</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                        <div className="flex flex-col">
                            <span className="text-xs text-slate-500 font-medium">Labor</span>
                            <span className="text-sm font-bold">{Math.round(laborP)}%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Vehicle Cost Table (Simplified Top 5) */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 w-full border-b pb-2">Vehicle Efficiency (CPM)</h4>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr>
                                <th className="pb-3 text-xs font-bold text-slate-400 uppercase">Vehicle</th>
                                <th className="pb-3 text-xs font-bold text-slate-400 uppercase text-right">Cost/Mile</th>
                                <th className="pb-3 text-xs font-bold text-slate-400 uppercase text-right">Total</th>
                                <th className="pb-3 text-xs font-bold text-slate-400 uppercase text-center">Top Exp.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data.vehicleBreakdown.map(v => (
                                <tr key={v.truckId} className="hover:bg-slate-50 group">
                                    <td className="py-3 text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">{v.plateNumber}</td>
                                    <td className="py-3 text-sm font-bold text-right text-slate-900">${v.cpm.toFixed(2)}</td>
                                    <td className="py-3 text-sm text-right text-slate-500">${v.totalCost.toLocaleString()}</td>
                                    <td className="py-3 text-center">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide
                               ${v.topExpenseCategory === 'Fuel' ? 'bg-blue-100 text-blue-700' :
                                                v.topExpenseCategory === 'Maintenance' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-700'}`}>
                                            {v.topExpenseCategory}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};

export default TCOCharts;
