import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Fuel,
    Plus,
    BarChart3,
    TrendingUp,
    Droplets,
    DollarSign,
    AlertTriangle,
    Gauge,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import FuelLogTable from '../components/FleetDashboard/Fuel/FuelLogTable';
import FuelEntryModal from '../components/FleetDashboard/Fuel/FuelEntryModal';
import FuelDetailsModal from '../components/FleetDashboard/Fuel/FuelDetailsModal';
import { fuelApi } from '../services/fuelApi';
import type { FuelEntry } from '../services/fleetApi';
import DashboardHeader from '../components/Layout/DashboardHeader';
import DashboardFooter from '../components/Layout/DashboardFooter';
import { DetailedErrorBoundary } from '../components/DetailedErrorBoundary';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

const formatCurrency = (value?: number) =>
    typeof value === 'number' && !Number.isNaN(value)
        ? `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
        : '—';

const formatNumber = (value?: number, digits = 1) =>
    typeof value === 'number' && !Number.isNaN(value)
        ? value.toLocaleString(undefined, { maximumFractionDigits: digits })
        : '—';

const FuelPage: React.FC<{ isEmbedded?: boolean }> = ({ isEmbedded }) => {
    const [stats, setStats] = useState<any>(null);
    const [logs, setLogs] = useState<FuelEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedLog, setSelectedLog] = useState<FuelEntry | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        loadFuelData();
    }, []);

    const loadFuelData = async () => {
        setLoading(true);
        try {
            const [statsData, logsData] = await Promise.all([
                fuelApi.getFuelStatistics().catch(() => null),
                fuelApi.getFuelLogs().catch(() => []),
            ]);

            if (statsData) {
                setStats({
                    totalCost: statsData.totalSpend,
                    totalGallons: statsData.totalVolume,
                    avgCostPerGallon: statsData.avgPricePerGallon,
                    avgMpg: statsData.fleetEfficiency,
                    flaggedTransactions: statsData.fraudAlerts,
                    dailyTrend: statsData.dailyTrend || [],
                    truckEfficiency: statsData.truckEfficiency || [],
                });
            }

            const mappedLogs: FuelEntry[] = (logsData || []).map(log => ({
                id: log.id,
                truckId: log.truck?.plateNumber || log.truckId,
                driverId: log.driver ? `${log.driver.firstName} ${log.driver.lastName}` : (log.driverId || 'N/A'),
                date: log.fuelDate,
                gallons: Number(log.gallons),
                costPerGallon: Number(log.pricePerGallon),
                totalCost: Number(log.totalCost),
                odometer: Number(log.odometer || 0),
                location: log.location,
                fuelType: (log as any).fuelType || 'Diesel',
                isFullTank: true,
                jurisdiction: 'N/A',
                status: log.status.toLowerCase() as any,
                notes: log.notes,
                receiptUrl: (log as any).metadata?.receiptFileUrl
                    ? `http://localhost:3005${(log as any).metadata.receiptFileUrl}`
                    : undefined,
                odometerImageUrl: (log as any).metadata?.odometerVerificationFileUrl
                    ? `http://localhost:3005${(log as any).metadata.odometerVerificationFileUrl}`
                    : undefined,
            }));

            setLogs(mappedLogs);
        } catch (error) {
            console.error('Failed to load fuel data:', error);
            toast.error('Failed to update fuel dashboard');
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = logs.filter((log: FuelEntry) => {
        if (filter === 'flagged') return log.status === 'flagged';
        return true;
    });

    const kpiCards = [
        {
            label: 'Total Spend',
            value: formatCurrency(stats?.totalCost),
            icon: DollarSign,
            accent: 'text-[#2c5173] bg-[#2c5173]/10',
        },
        {
            label: 'Volume',
            value: `${formatNumber(stats?.totalGallons, 0)} gal`,
            icon: Droplets,
            accent: 'text-sky-600 bg-sky-50 dark:text-sky-400 dark:bg-sky-900/30',
        },
        {
            label: 'Avg $/gal',
            value: formatCurrency(stats?.avgCostPerGallon),
            icon: Fuel,
            accent: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/30',
        },
        {
            label: 'Fleet MPG',
            value: formatNumber(stats?.avgMpg),
            icon: Gauge,
            accent: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30',
        },
    ];

    return (
        <DetailedErrorBoundary>
            <div className={isEmbedded ? 'w-full' : 'min-h-screen bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-200'}>
                {!isEmbedded && <DashboardHeader />}

                {!isEmbedded && (
                    <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2c5173] mb-2">
                                        Fleet Operations
                                    </p>
                                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                                        Fuel
                                    </h1>
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                        Usage trends, efficiency, and transaction history
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2c5173] text-white rounded-xl text-sm font-semibold hover:bg-[#1f3a53] active:scale-[0.98] transition-all"
                                >
                                    <Plus size={16} />
                                    Add Record
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className={isEmbedded ? 'space-y-6' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6'}>
                    {/* Toolbar (embedded) */}
                    {isEmbedded && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="h-11 w-11 rounded-xl bg-[#2c5173]/10 text-[#2c5173] flex items-center justify-center">
                                    <Fuel size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                                        Fuel
                                    </h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Usage trends, efficiency, and transaction history
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#2c5173] text-white rounded-xl text-sm font-semibold hover:bg-[#1f3a53] active:scale-[0.98] transition-all self-start sm:self-auto"
                            >
                                <Plus size={16} />
                                Add Record
                            </button>
                        </div>
                    )}

                    {/* KPI strip */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        {kpiCards.map((kpi) => (
                            <div
                                key={kpi.label}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                            {kpi.label}
                                        </p>
                                        <p className="mt-2 text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                                            {loading ? '…' : kpi.value}
                                        </p>
                                    </div>
                                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${kpi.accent}`}>
                                        <kpi.icon size={16} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Analytics */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
                        <div className="xl:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-[#2c5173]/10 text-[#2c5173] flex items-center justify-center">
                                        <BarChart3 size={18} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                            Spend Trend
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Daily fuel cost over time
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                    <span className="inline-flex items-center gap-1.5">
                                        <span className="h-2 w-2 rounded-full bg-[#2c5173]" />
                                        Cost
                                    </span>
                                </div>
                            </div>

                            <div className="h-[260px] w-full">
                                {stats?.dailyTrend?.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={stats.dailyTrend}>
                                            <defs>
                                                <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#2c5173" stopOpacity={0.18} />
                                                    <stop offset="95%" stopColor="#2c5173" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                vertical={false}
                                                stroke="currentColor"
                                                className="text-slate-100 dark:text-slate-800"
                                            />
                                            <XAxis
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 11, fill: '#64748B' }}
                                                dy={8}
                                                interval="preserveStartEnd"
                                            />
                                            <YAxis hide />
                                            <Tooltip
                                                contentStyle={{
                                                    borderRadius: '12px',
                                                    border: '1px solid #e2e8f0',
                                                    fontSize: '12px',
                                                    fontWeight: 600,
                                                    backgroundColor: undefined,
                                                    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
                                                }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="cost"
                                                stroke="#2c5173"
                                                strokeWidth={2.5}
                                                fillOpacity={1}
                                                fill="url(#colorCost)"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-full items-center justify-center text-sm text-slate-400 dark:text-slate-500">
                                        No fuel spend data yet
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                    <TrendingUp size={18} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                        Truck Efficiency
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        MPG by vehicle
                                    </p>
                                </div>
                            </div>

                            <div className="flex-1 space-y-4">
                                {stats?.truckEfficiency?.length > 0 ? (
                                    stats.truckEfficiency.slice(0, 6).map((item: any, idx: number) => (
                                        <div key={item.plate} className="space-y-1.5">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-semibold text-slate-700 dark:text-slate-200">
                                                    {item.plate}
                                                </span>
                                                <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                                                    {item.mpg} MPG
                                                </span>
                                            </div>
                                            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min((item.mpg / 12) * 100, 100)}%` }}
                                                    transition={{ delay: idx * 0.08, duration: 0.7 }}
                                                    className={`h-full rounded-full ${item.mpg > 6 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                                />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex h-full min-h-[180px] items-center justify-center text-sm text-slate-400 dark:text-slate-500 text-center px-4">
                                        No odometer data available yet
                                    </div>
                                )}
                            </div>

                            {typeof stats?.flaggedTransactions === 'number' && stats.flaggedTransactions > 0 && (
                                <div className="mt-6 flex items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/40 px-3 py-2.5 text-xs text-amber-700 dark:text-amber-300">
                                    <AlertTriangle size={14} className="shrink-0" />
                                    <span>
                                        <strong>{stats.flaggedTransactions}</strong> flagged transaction
                                        {stats.flaggedTransactions === 1 ? '' : 's'} need review
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Fuel Log */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                        <div className="px-5 sm:px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    Fuel Log
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    {filteredLogs.length} record{filteredLogs.length === 1 ? '' : 's'}
                                    {filter === 'flagged' ? ' flagged' : ''}
                                </p>
                            </div>

                            <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl self-start">
                                <button
                                    onClick={() => setFilter('all')}
                                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                                        filter === 'all'
                                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => setFilter('flagged')}
                                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                                        filter === 'flagged'
                                            ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                                >
                                    Alerts
                                </button>
                            </div>
                        </div>

                        <div className="min-h-[360px]">
                            <FuelLogTable
                                logs={filteredLogs}
                                loading={loading}
                                onRowClick={(log) => {
                                    setSelectedLog(log);
                                    setIsDetailsOpen(true);
                                }}
                            />
                        </div>
                    </div>
                </div>

                {!isEmbedded && <DashboardFooter />}

                <FuelEntryModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={loadFuelData}
                />

                <FuelDetailsModal
                    log={selectedLog}
                    isOpen={isDetailsOpen}
                    onClose={() => setIsDetailsOpen(false)}
                />
            </div>
        </DetailedErrorBoundary>
    );
};

export default FuelPage;
