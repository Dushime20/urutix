import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Fuel,
    AlertTriangle,
    Plus,
    DollarSign,
    Droplets,
    TrendingUp,
    ShieldCheck,
    BarChart3,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import FuelLogTable from '../components/FleetDashboard/Fuel/FuelLogTable';
import FuelEntryModal from '../components/FleetDashboard/Fuel/FuelEntryModal';
import FuelDetailsModal from '../components/FleetDashboard/Fuel/FuelDetailsModal';
import { FuelWalletTab } from '../components/FleetDashboard/Fuel/FuelWalletTab';
import { FuelBudgetsTab } from '../components/FleetDashboard/Fuel/FuelBudgetsTab';
import { FuelAdvancesTab } from '../components/FleetDashboard/Fuel/FuelAdvancesTab';
import { fuelApi } from '../services/fuelApi';
import type { FuelEntry } from '../services/fleetApi';
import { cn } from '../utils/cn';
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

const MOCK_LINE_DATA = [
    { name: 'Mon', cost: 1200, gallons: 300 },
    { name: 'Tue', cost: 1400, gallons: 340 },
    { name: 'Wed', cost: 1100, gallons: 280 },
    { name: 'Thu', cost: 1800, gallons: 450 },
    { name: 'Fri', cost: 2100, gallons: 520 },
    { name: 'Sat', cost: 900, gallons: 220 },
    { name: 'Sun', cost: 800, gallons: 200 },
];

const MOCK_BAR_DATA = [
    { plate: 'URT-001', mpg: 6.8 },
    { plate: 'URT-012', mpg: 5.4 },
    { plate: 'URT-045', mpg: 7.2 },
    { plate: 'URT-098', mpg: 4.9 },
    { plate: 'URT-102', mpg: 6.1 },
];

const FuelPage: React.FC<{ isEmbedded?: boolean }> = ({ isEmbedded }) => {
    const [stats, setStats] = useState<any>(null);
    const [logs, setLogs] = useState<FuelEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedLog, setSelectedLog] = useState<FuelEntry | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [filter, setFilter] = useState('all');
    const [activeTab, setActiveTab] = useState<'records' | 'wallets' | 'budgets' | 'advances'>('records');

    useEffect(() => {
        loadFuelData();
    }, []);

    const loadFuelData = async () => {
        setLoading(true);
        console.log('🔄 loadFuelData: Starting fetch...');
        try {
            const [statsData, logsData] = await Promise.all([
                fuelApi.getFuelStatistics().catch(err => {
                    console.error('❌ Error fetching statistics:', err);
                    return null;
                }),
                fuelApi.getFuelLogs().catch(err => {
                    console.error('❌ Error fetching logs:', err);
                    return [];
                })
            ]);

            console.log('✅ loadFuelData: Received data', { statsData, logsCount: logsData?.length });

            // Stats data can be null if it failed but we caught it
            if (statsData) {
                setStats({
                    totalCost: statsData.totalSpend,
                    totalGallons: statsData.totalVolume,
                    avgCostPerGallon: statsData.avgPricePerGallon,
                    avgMpg: statsData.fleetEfficiency,
                    flaggedTransactions: statsData.fraudAlerts
                });
            }

            // Map FuelLog from backend to FuelEntry expected by FuelLogTable
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
                isFullTank: true, // Backend doesn't store this yet?
                jurisdiction: 'N/A', // Mapping required if needed
                status: log.status.toLowerCase() as any,
                notes: log.notes
            }));

            setLogs(mappedLogs);
        } catch (error) {
            console.error('❌ Failed to load fuel data (Unexpected Error):', error);
            toast.error('Failed to update fuel dashboard');
        } finally {
            setLoading(false);
            console.log('🏁 loadFuelData: Finished');
        }
    };

    const filteredLogs = logs.filter((log: FuelEntry) => {
        if (filter === 'flagged') return log.status === 'flagged';
        return true;
    });

    const CircularStatsCard = ({ title, value, icon: Icon, colorClass, secondaryColor }: any) => {
        return (
            <div className="flex flex-col items-center group">
                <div className="relative w-40 h-40 rounded-full bg-white dark:bg-slate-900 border-[8px] border-slate-50 dark:border-slate-800 flex flex-col items-center justify-center transition-all duration-500 hover:border-slate-100 dark:hover:border-slate-700 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-slate-950/50">
                    <svg className="absolute inset-0 w-full h-full -rotate-90 scale-[1.05]">
                        <circle
                            cx="80"
                            cy="80"
                            r="72"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeDasharray="452"
                            strokeDashoffset="350"
                            className={cn("opacity-10 transition-all duration-1000 group-hover:stroke-dashoffset-[200]", secondaryColor)}
                        />
                    </svg>

                    <div className={cn("p-2 rounded-2xl mb-2 bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:bg-white dark:group-hover:bg-slate-700 group-hover:text-inherit transition-all duration-500 shadow-sm", colorClass)}>
                        <Icon size={18} />
                    </div>

                    <div className="flex flex-col items-center px-4 w-full overflow-hidden">
                        <span className="text-xl font-black text-[#0f172a] dark:text-white tracking-tight group-hover:scale-110 transition-transform duration-500 truncate w-full text-center">
                            {value}
                        </span>
                    </div>

                    <div className="absolute inset-4 rounded-full border border-dashed border-slate-100 dark:border-slate-800 opacity-50 group-hover:rotate-90 transition-transform duration-1000" />
                </div>

                <div className="mt-4 text-center px-2">
                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] group-hover:text-[#345E85] dark:group-hover:text-blue-400 transition-colors duration-300 line-clamp-1">
                        {title}
                    </p>
                </div>
            </div>
        );
    };

    return (
        <DetailedErrorBoundary>
            <div className={isEmbedded ? "w-full" : "min-h-screen bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-200"}>
                {!isEmbedded && <DashboardHeader />}

                {/* Main Header Section */}
                {!isEmbedded && (
                    <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 relative overflow-hidden transition-colors duration-200">
                    <div className="absolute top-0 right-0 p-20 opacity-[0.03] scale-[2.5] pointer-events-none rotate-12">
                        <Fuel size={140} className="text-primary-500" />
                    </div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-primary-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-primary-500 dark:text-blue-400">
                                        <Fuel size={20} />
                                    </div>
                                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-500 dark:text-blue-400">Fuel Tracking</h2>
                                </div>

                                <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1">
                                    Fuel
                                </h1>
                                <p className="text-lg text-slate-500 dark:text-slate-400 font-medium max-w-xl">
                                    Track usage, efficiency, and real-time data.
                                </p>
                            </div>

                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="flex items-center gap-2.5 px-6 py-4 bg-primary-500 dark:bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-primary-600 dark:hover:bg-blue-700 active:scale-95 transition-all group shadow-lg shadow-blue-500/10"
                            >
                                <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                                Add Record
                            </button>
                        </div>
                    </div>
                </div>
                )}

                <div className={isEmbedded ? "space-y-12" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12"}>
                     {/* Fuel Stats Overview */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-12 place-items-center bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-200"
                    >
                        <CircularStatsCard
                            title="Total Spend"
                            value={`$${Number(stats?.totalCost || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                            icon={DollarSign}
                            colorClass="bg-blue-50 text-blue-600"
                            secondaryColor="text-blue-600"
                        />
                        <CircularStatsCard
                            title="Fuel Volume"
                            value={`${Number(stats?.totalGallons || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} Gal`}
                            icon={Droplets}
                            colorClass="bg-emerald-50 text-emerald-600"
                            secondaryColor="text-emerald-600"
                        />
                        <CircularStatsCard
                            title="Avg. MPG"
                            value={`${Number(stats?.avgMpg || 0).toFixed(1)} MPG`}
                            icon={TrendingUp}
                            colorClass="bg-primary-50 text-primary-500"
                            secondaryColor="text-primary-500"
                        />
                        <CircularStatsCard
                            title="Fraud Alerts"
                            value={stats?.flaggedTransactions || 0}
                            icon={AlertTriangle}
                            colorClass="bg-rose-50 text-rose-600"
                            secondaryColor="text-rose-600"
                        />
                    </motion.div>

                    {/* Analytics & Performance */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 space-y-8 transition-colors duration-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="size-12 bg-primary-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-primary-500 dark:text-blue-400">
                                        <BarChart3 size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Truck Efficiency</h3>
                                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Fuel performance rankings</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <span className="flex items-center gap-1.5 text-[9px] font-black text-primary-500 uppercase tracking-widest">
                                        <div className="size-2 rounded-full bg-primary-500" /> Cost
                                    </span>
                                    <span className="flex items-center gap-1.5 text-[9px] font-black text-emerald-500 uppercase tracking-widest ml-4">
                                        <div className="size-2 rounded-full bg-emerald-500" /> Volume
                                    </span>
                                </div>
                            </div>

                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={stats?.dailyTrend || MOCK_LINE_DATA}>
                                        <defs>
                                            <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#345E85" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#345E85" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={document.documentElement.classList.contains('dark') ? '#1e293b' : '#F1F5F9'} />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10, fontWeight: 800, fill: '#64748B' }}
                                            dy={10}
                                        />
                                        <YAxis hide />
                                        <Tooltip
                                            contentStyle={{ 
                                                borderRadius: '20px', 
                                                border: 'none', 
                                                fontSize: '10px', 
                                                fontWeight: 800,
                                                backgroundColor: document.documentElement.classList.contains('dark') ? '#0f172a' : '#fff',
                                                color: document.documentElement.classList.contains('dark') ? '#fff' : '#000',
                                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                            }}
                                            itemStyle={{ color: 'inherit' }}
                                        />
                                        <Area type="monotone" dataKey="cost" stroke="#345E85" strokeWidth={4} fillOpacity={1} fill="url(#colorCost)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-[#1A1C1E] p-8 rounded-[40px] border border-slate-800 relative overflow-hidden flex flex-col justify-between">
                            <div className="absolute top-0 right-0 p-10 opacity-5 scale-[2.5] pointer-events-none">
                                <ShieldCheck size={100} className="text-white" />
                            </div>

                            <div className="space-y-6 relative z-10">
                                <div className="size-14 bg-white/10 rounded-[22px] flex items-center justify-center text-emerald-400">
                                    <TrendingUp size={28} />
                                </div>
                                <h3 className="text-lg font-black text-white tracking-tight uppercase leading-tight">
                                    Truck <br /><span className="text-emerald-400">Performance</span>
                                </h3>

                                <div className="space-y-4 pt-4">
                                    {(stats?.truckEfficiency?.length > 0 ? stats.truckEfficiency : MOCK_BAR_DATA).map((item: any, idx: number) => (
                                        <div key={item.plate} className="space-y-1.5">
                                            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                <span>{item.plate}</span>
                                                <span className="text-white">{item.mpg} MPG</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min((item.mpg / 12) * 100, 100)}%` }}
                                                    transition={{ delay: idx * 0.1, duration: 1 }}
                                                    className={`h-full rounded-full ${item.mpg > 6 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Fuel Records Tab Navigation Section */}
                    <div className="flex border-b border-slate-200 dark:border-slate-800 mt-8 mb-4 overflow-x-auto gap-4 transition-colors duration-200">
                        <button
                            className={`pb-4 px-4 font-bold text-sm tracking-widest uppercase whitespace-nowrap border-b-2 transition-colors ${activeTab === 'records' ? 'border-primary-500 text-primary-500 dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'}`}
                            onClick={() => setActiveTab('records')}
                        >
                            Logs & Records
                        </button>
                        <button
                            className={`pb-4 px-4 font-bold text-sm tracking-widest uppercase whitespace-nowrap border-b-2 transition-colors ${activeTab === 'wallets' ? 'border-primary-500 text-primary-500 dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'}`}
                            onClick={() => setActiveTab('wallets')}
                        >
                            Fuel Wallets
                        </button>
                        <button
                            className={`pb-4 px-4 font-bold text-sm tracking-widest uppercase whitespace-nowrap border-b-2 transition-colors ${activeTab === 'budgets' ? 'border-primary-500 text-primary-500 dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'}`}
                            onClick={() => setActiveTab('budgets')}
                        >
                            Budgets
                        </button>
                        <button
                            className={`pb-4 px-4 font-bold text-sm tracking-widest uppercase whitespace-nowrap border-b-2 transition-colors ${activeTab === 'advances' ? 'border-primary-500 text-primary-500 dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'}`}
                            onClick={() => setActiveTab('advances')}
                        >
                            Advances & Approvals
                        </button>
                    </div>

                    {/* Fuel Records Table Section */}
                    {activeTab === 'records' && (
                        <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors duration-200">
                            <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Fuel Log</h3>
                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Review your recent fuel records</p>
                                </div>

                                <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl transition-colors duration-200">
                                    <button
                                        onClick={() => setFilter('all')}
                                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'all' ? 'bg-white dark:bg-slate-700 text-primary-500 dark:text-blue-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                    >
                                        All History
                                    </button>
                                    <button
                                        onClick={() => setFilter('flagged')}
                                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'flagged' ? 'bg-white dark:bg-slate-700 text-error-500 dark:text-rose-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                    >
                                        Alerts Only
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 p-2 rounded-[40px] border border-slate-100 dark:border-slate-800 overflow-hidden min-h-[400px]">
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
                    )}

                    {activeTab === 'wallets' && <FuelWalletTab />}
                    {activeTab === 'budgets' && <FuelBudgetsTab />}
                    {activeTab === 'advances' && <FuelAdvancesTab />}
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
