import React, { useState, useEffect } from 'react';
import { FaGasPump, FaChartLine, FaExclamationTriangle, FaPlus, FaDollarSign, FaSearch } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import DashboardLayout from '../components/Layout/DashboardLayout';
import FuelLogTable from '../components/FleetDashboard/Fuel/FuelLogTable';
import FuelEntryModal from '../components/FleetDashboard/Fuel/FuelEntryModal';
import { fleetApi } from '../services/fleetApi';
import type { FuelEntry } from '../services/fleetApi';

const FuelPage: React.FC = () => {
    const [stats, setStats] = useState<any>(null);
    const [logs, setLogs] = useState<FuelEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        loadFuelData();
    }, []);

    const loadFuelData = async () => {
        setLoading(true);
        try {
            const [statsData, logsData] = await Promise.all([
                fleetApi.getFuelStats(),
                fleetApi.getFuelLogs()
            ]);
            setStats(statsData);
            setLogs(logsData);
        } catch (error) {
            console.error('Failed to load fuel data', error);
            toast.error('Failed to update fuel dashboard');
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = logs.filter(log => {
        if (filter === 'flagged') return log.status === 'flagged';
        return true;
    });

    return (
        <div className="min-h-screen bg-slate-50 p-6 lg:p-10 space-y-8">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Fuel Management</h1>
                    <p className="text-slate-500 font-medium mt-1">Monitor consumption, costs, and detect anomalies.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-5 py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-amber-500/25 transition-all active:scale-95"
                >
                    <FaPlus /> Add Fuel Log
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Spend */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between group hover:border-blue-200 transition-colors">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Fuel Spend (Mo)</p>
                        <h3 className="text-3xl font-black text-slate-800 group-hover:text-blue-600 transition-colors">
                            ${stats?.totalCost?.toLocaleString() || '0.00'}
                        </h3>
                        <p className="text-xs font-medium text-emerald-500 flex items-center gap-1 mt-2">
                            <FaChartLine /> +4.2% vs last month
                        </p>
                    </div>
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <FaDollarSign className="text-xl" />
                    </div>
                </div>

                {/* Gallons */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between group hover:border-emerald-200 transition-colors">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Volume</p>
                        <h3 className="text-3xl font-black text-slate-800 group-hover:text-emerald-600 transition-colors">
                            {stats?.totalGallons?.toLocaleString() || '0'} <span className="text-sm text-slate-400 font-bold">gal</span>
                        </h3>
                        <p className="text-xs font-medium text-slate-500 mt-2">
                            Avg ${stats?.avgCostPerGallon?.toFixed(2)} / gal
                        </p>
                    </div>
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                        <FaGasPump className="text-xl" />
                    </div>
                </div>

                {/* Efficiency */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between group hover:border-purple-200 transition-colors">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Fleet Efficiency</p>
                        <h3 className="text-3xl font-black text-slate-800 group-hover:text-purple-600 transition-colors">
                            {stats?.avgMpg || '0.0'} <span className="text-sm text-slate-400 font-bold">MPG</span>
                        </h3>
                        <p className="text-xs font-medium text-emerald-500 mt-2">
                            Above industry avg
                        </p>
                    </div>
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                        <FaChartLine className="text-xl" />
                    </div>
                </div>

                {/* Alerts */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between group hover:border-red-200 transition-colors">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Fraud Alerts</p>
                        <h3 className={`text-3xl font-black transition-colors ${stats?.flaggedTransactions > 0 ? 'text-red-500' : 'text-slate-800'}`}>
                            {stats?.flaggedTransactions || 0}
                        </h3>
                        <p className="text-xs font-medium text-slate-500 mt-2">
                            Suspicious transactions
                        </p>
                    </div>
                    <div className={`p-3 rounded-xl ${stats?.flaggedTransactions > 0 ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-400'}`}>
                        <FaExclamationTriangle className="text-xl" />
                    </div>
                </div>
            </div>

            {/* Filters & Content */}
            <div className="space-y-4">
                <div className="flex items-center gap-4 bg-white p-2 rounded-xl border border-slate-200 w-fit">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === 'all' ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        All Logs
                    </button>
                    <button
                        onClick={() => setFilter('flagged')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${filter === 'flagged' ? 'bg-red-50 text-red-600' : 'text-slate-500 hover:text-red-500'}`}
                    >
                        <FaExclamationTriangle /> Flagged Alerts
                    </button>
                </div>

                <FuelLogTable logs={filteredLogs} loading={loading} />
            </div>

            {/* Modals */}
            <FuelEntryModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={loadFuelData}
            />
        </div>
    );
};

export default FuelPage;
