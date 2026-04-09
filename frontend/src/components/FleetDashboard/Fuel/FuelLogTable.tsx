import React from 'react';
import {
    CheckCircle2,
    AlertTriangle,
    Clock,
    Truck,
    User,
    Calendar,
    Droplets,
    ChevronRight,
    Fuel,
    FileText,
    Navigation
} from 'lucide-react';
import type { FuelEntry } from '../../../services/fleetApi';
import { motion } from 'framer-motion';

interface FuelLogTableProps {
    logs: FuelEntry[];
    loading?: boolean;
    onRowClick: (log: FuelEntry) => void;
}

const FuelLogTable: React.FC<FuelLogTableProps> = ({ logs, loading, onRowClick }) => {
    if (loading) {
        return (
            <div className="w-full h-80 flex flex-col items-center justify-center gap-4 animate-pulse">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center transition-colors">
                    <Droplets className="text-slate-200 dark:text-slate-700 animate-bounce" size={24} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 dark:text-slate-600">Loading fuel records...</p>
            </div>
        );
    }

    if (logs.length === 0) {
        return (
            <div className="w-full py-24 flex flex-col items-center justify-center gap-6 text-center">
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] flex items-center justify-center border border-slate-100 dark:border-slate-800 transition-colors">
                    <Fuel size={40} className="text-slate-200 dark:text-slate-700" />
                </div>
                <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">No Fuel Logs Found</h4>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">There are no fuel entries recorded for this period.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800/50 transition-colors">
                            <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Date & Time</th>
                            <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Vehicle & Driver</th>
                            <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Jurisdiction</th>
                            <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Type</th>
                            <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Volume</th>
                            <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Cost</th>
                            <th className="px-8 py-6 text-center text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Status</th>
                            <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Report</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                        {logs.map((log, index) => (
                            <motion.tr
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                key={log.id}
                                onClick={() => onRowClick(log)}
                                className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group cursor-pointer"
                            >
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:border-blue-100 dark:group-hover:border-blue-900 transition-all">
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
                                </td>
                                <td className="px-8 py-6">
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
                                </td>
                                <td className="px-8 py-6">
                                    <span className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-[0.1em]">{log.jurisdiction}</span>
                                </td>
                                <td className="px-8 py-6">
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
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <div className="inline-flex flex-col items-end">
                                        <span className="text-[13px] font-black text-slate-900 dark:text-white">{log.gallons.toFixed(1)}</span>
                                        <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                            <Navigation size={8} /> {log.odometer?.toLocaleString()}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <div className="inline-flex flex-col items-end">
                                        <span className="text-[13px] font-black text-slate-900 dark:text-white">${log.totalCost.toFixed(0)}</span>
                                        <span className="text-[9px] font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-widest">${log.costPerGallon.toFixed(2)}/Gal</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex justify-center">
                                        {log.status === 'verified' && (
                                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-widest rounded-xl border border-emerald-100 dark:border-emerald-800/30">
                                                <CheckCircle2 size={10} /> Verified
                                            </span>
                                        )}
                                        {log.status === 'flagged' && (
                                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[9px] font-black uppercase tracking-widest rounded-xl border border-rose-100 dark:border-rose-800/30">
                                                <AlertTriangle size={10} /> Flagged
                                            </span>
                                        )}
                                        {log.status === 'pending' && (
                                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] font-black uppercase tracking-widest rounded-xl border border-amber-100 dark:border-amber-800/30">
                                                <Clock size={10} /> Pending
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <div className="flex justify-end gap-2">
                                        {log.receiptUrl && (
                                            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400 rounded-xl cursor-help transition-colors" title="Receipt Attached">
                                                <FileText size={16} />
                                            </div>
                                        )}
                                        <button className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-xl hover:bg-slate-900 dark:hover:bg-slate-700 hover:text-white transition-all transform hover:scale-110 active:scale-95">
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default FuelLogTable;
