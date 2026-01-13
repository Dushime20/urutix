import React from 'react';
import { FaExclamationTriangle, FaCheckCircle, FaClock } from 'react-icons/fa';
import type { FuelEntry } from '../../../services/fleetApi';

interface FuelLogTableProps {
    logs: FuelEntry[];
    loading?: boolean;
}

const FuelLogTable: React.FC<FuelLogTableProps> = ({ logs, loading }) => {
    if (loading) {
        return (
            <div className="w-full h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (logs.length === 0) {
        return (
            <div className="w-full p-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-slate-500 font-medium">No fuel logs found.</p>
            </div>
        );
    }

    return (
        <div className="w-full overflow-hidden bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Vehicle</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Driver</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Location</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Gallons</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Cost</th>
                            <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {logs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-700">
                                    {new Date(log.date).toLocaleDateString()}
                                    <span className="block text-xs text-slate-400 font-normal">
                                        {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-800">
                                    <span className="bg-slate-100 px-2 py-1 rounded text-xs mr-2">TRK</span>
                                    {log.truckId}
                                    {/* Ideally map ID to Plate Number using context or prop lookup */}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                    {log.driverId}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                    {log.location}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-slate-700">
                                    {log.gallons.toFixed(1)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                    <div className="font-bold text-slate-800">${log.totalCost.toFixed(2)}</div>
                                    <div className="text-xs text-slate-400">${log.costPerGallon.toFixed(2)} / gal</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    {log.status === 'verified' && (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                                            <FaCheckCircle /> Verified
                                        </span>
                                    )}
                                    {log.status === 'flagged' && (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                                            <FaExclamationTriangle /> Flagged
                                        </span>
                                    )}
                                    {log.status === 'pending' && (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                                            <FaClock /> Pending
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default FuelLogTable;
