import React, { useMemo } from 'react';
import { Package, AlertTriangle } from 'lucide-react';

interface Cargo {
    id: string;
    status: string;
    urgencyLevel?: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
}

interface CargoDistributionChartsProps {
    cargos: Cargo[];
}

export const CargoDistributionCharts: React.FC<CargoDistributionChartsProps> = ({ cargos }) => {
    // Calculate distributions
    const distributions = useMemo(() => {
        // Status distribution
        const statusDistribution = cargos.reduce((acc, cargo) => {
            acc[cargo.status] = (acc[cargo.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Urgency distribution
        const urgencyDistribution = cargos.reduce((acc, cargo) => {
            const urgency = cargo.urgencyLevel || 'NORMAL';
            acc[urgency] = (acc[urgency] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            statusDistribution,
            urgencyDistribution,
            totalCargos: cargos.length,
        };
    }, [cargos]);

    // Get status color
    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            DRAFT: 'bg-slate-500',
            PUBLISHED: 'bg-emerald-500',
            IN_TRANSIT: 'bg-[#345E85]',
            DELIVERED: 'bg-emerald-600',
            CANCELLED: 'bg-rose-500',
            ASSIGNED: 'bg-primary-500',
            COMPLETED: 'bg-emerald-500',
        };
        return colors[status] || 'bg-gray-500';
    };

    // Get urgency color
    const getUrgencyColor = (urgency: string) => {
        const colors: Record<string, string> = {
            LOW: 'bg-emerald-400',
            NORMAL: 'bg-primary-400',
            HIGH: 'bg-amber-500',
            CRITICAL: 'bg-rose-600',
        };
        return colors[urgency] || 'bg-gray-500';
    };

    if (distributions.totalCargos === 0) return null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Status Distribution */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Package className="w-4 h-4 text-primary-600" />
                    📊 Cargo by Status
                </h3>
                <div className="space-y-3">
                    {Object.entries(distributions.statusDistribution)
                        .sort(([, a], [, b]) => b - a) // Sort by count descending
                        .map(([status, count]) => {
                            const percentage = (count / distributions.totalCargos) * 100;
                            return (
                                <div key={status} className="space-y-1">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium text-gray-700 capitalize">{status.replace('_', ' ').toLowerCase()}</span>
                                        <span className="text-gray-600">{count} ({percentage.toFixed(0)}%)</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${getStatusColor(status)}`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                </div>
            </div>

            {/* Urgency Distribution */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    ⚡ Cargo by Urgency
                </h3>
                <div className="space-y-3">
                    {['CRITICAL', 'HIGH', 'NORMAL', 'LOW']
                        .filter(urgency => distributions.urgencyDistribution[urgency])
                        .map((urgency) => {
                            const count = distributions.urgencyDistribution[urgency];
                            const percentage = (count / distributions.totalCargos) * 100;
                            return (
                                <div key={urgency} className="space-y-1">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium text-gray-700">{urgency}</span>
                                        <span className="text-gray-600">{count} ({percentage.toFixed(0)}%)</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${getUrgencyColor(urgency)}`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                </div>
            </div>
        </div>
    );
};
