import React from 'react';
import { type TCOAnalysis } from '../../../services/fleetApi';
import { useCurrencyFormat } from '../../../hooks/useCurrencyFormat';

interface TCOChartsProps {
    data: TCOAnalysis;
}

const TCOCharts: React.FC<TCOChartsProps> = ({ data }) => {
    const { compact: fmtMoney } = useCurrencyFormat();
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
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center transition-colors duration-200">
                <div className="w-full border-b border-slate-50 dark:border-slate-800 pb-4 mb-6">
                    <h4 className="text-lg font-black text-[#0f172a] dark:text-white uppercase tracking-tight">Cost Composition</h4>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Expense Categorization</p>
                </div>

                <div className="relative w-48 h-48 mb-8">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        {/* Fuel (Blue) */}
                        <circle cx="50" cy="50" fill="transparent" r="40" stroke="#2563eb" strokeWidth="12" strokeDasharray={`${fuelDash} ${c}`} className="opacity-90" />
                        {/* Maint (Orange - changed to Amber) */}
                        <circle cx="50" cy="50" fill="transparent" r="40" stroke="#f59e0b" strokeWidth="12" strokeDasharray={`${maintDash} ${c}`} strokeDashoffset={maintOffset} className="opacity-90" />
                        {/* Fixed (Slate) */}
                        <circle cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" strokeWidth="12" strokeDasharray={`${fixedDash} ${c}`} strokeDashoffset={fixedOffset} className="opacity-90 text-slate-900 dark:text-slate-100" />
                        {/* Labor (Emerald) */}
                        <circle cx="50" cy="50" fill="transparent" r="40" stroke="#10b981" strokeWidth="12" strokeDasharray={`${laborDash} ${c}`} strokeDashoffset={laborOffset} className="opacity-90" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-3xl font-black text-[#0f172a] dark:text-white tracking-tight">{fmtMoney(data.totalCost)}</span>
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">TOTAL</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6 w-full max-w-xs">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-600 shadow-sm shadow-blue-200"></div>
                        <div className="flex flex-col">
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Fuel</span>
                            <span className="text-xs font-black text-[#0f172a] dark:text-white">{Math.round(fuelP)}%</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-amber-500 shadow-sm shadow-amber-200"></div>
                        <div className="flex flex-col">
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Maint.</span>
                            <span className="text-xs font-black text-[#0f172a] dark:text-white">{Math.round(maintP)}%</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-slate-900 shadow-sm shadow-slate-400"></div>
                        <div className="flex flex-col">
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Fixed</span>
                            <span className="text-xs font-black text-[#0f172a] dark:text-white">{Math.round(fixedP)}%</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200"></div>
                        <div className="flex flex-col">
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Labor</span>
                            <span className="text-xs font-black text-[#0f172a] dark:text-white">{Math.round(laborP)}%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Vehicle Cost Table (Simplified Top 5) */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col transition-colors duration-200">
                <div className="w-full border-b border-slate-50 dark:border-slate-800 pb-4 mb-4">
                    <h4 className="text-lg font-black text-[#0f172a] dark:text-white uppercase tracking-tight">Vehicle Efficiency</h4>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Cost Per Mile (CPM) Analysis</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr>
                                <th className="pb-4 text-[9px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest">Vehicle</th>
                                <th className="pb-4 text-[9px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest text-right">CPM</th>
                                <th className="pb-4 text-[9px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest text-right">Total</th>
                                <th className="pb-4 text-[9px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest text-center">Top Exp.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {data.vehicleBreakdown.map(v => (
                                <tr key={v.truckId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 group transition-colors">
                                    <td className="py-3 text-xs font-black text-[#0f172a] dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors uppercase tracking-tight">{v.plateNumber}</td>
                                    <td className="py-3 text-xs font-bold text-right text-slate-600 dark:text-slate-400">{fmtMoney(v.cpm)}</td>
                                    <td className="py-3 text-xs font-black text-right text-[#0f172a] dark:text-white">{fmtMoney(v.totalCost)}</td>
                                    <td className="py-3 text-center">
                                        <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border
                                            ${v.topExpenseCategory === 'Fuel' ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30' :
                                                v.topExpenseCategory === 'Maintenance' ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30' :
                                                    'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-700'}`}>
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
