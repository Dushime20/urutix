import React, { useState, useEffect } from 'react';
import {
    FaGasPump,
    FaTruck,
    FaDollarSign,
    FaSpinner,
    FaPlus,
    FaCheck,
    FaExclamationTriangle,
    FaClock,
    FaChartLine
} from 'react-icons/fa';
import { fuelApi, type FuelLog, type FuelStatistics } from '../services/fuelApi';
import toast from 'react-hot-toast';
import { cn } from '../utils/cn';

type TabType = 'all' | 'flagged';

const FuelManagement: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
    const [filteredLogs, setFilteredLogs] = useState<FuelLog[]>([]);
    const [statistics, setStatistics] = useState<FuelStatistics | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        filterLogs();
    }, [activeTab, fuelLogs]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [logs, stats] = await Promise.all([
                fuelApi.getFuelLogs(),
                fuelApi.getFuelStatistics(),
            ]);
            setFuelLogs(logs);
            setStatistics(stats);
        } catch (error) {
            console.error('Error loading fuel data:', error);
            toast.error('Failed to load fuel data');
        } finally {
            setLoading(false);
        }
    };

    const filterLogs = () => {
        if (activeTab === 'flagged') {
            setFilteredLogs(fuelLogs.filter(log => log.isFlagged));
        } else {
            setFilteredLogs(fuelLogs);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'VERIFIED':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800">
                        <FaCheck className="w-3 h-3" />
                        Verified
                    </span>
                );
            case 'PENDING':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-yellow-100 text-yellow-800">
                        <FaClock className="w-3 h-3" />
                        Pending
                    </span>
                );
            case 'FLAGGED':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800">
                        <FaExclamationTriangle className="w-3 h-3" />
                        Flagged
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
            <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                            Fuel Management
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">
                            Monitor consumption, costs, and detect anomalies
                        </p>
                    </div>
                    <button
                        onClick={() => toast.success('Add Fuel Log feature coming soon!')}
                        className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium shadow-sm text-sm sm:text-base"
                    >
                        <FaPlus className="w-4 h-4" />
                        Add Fuel Log
                    </button>
                </div>

                {/* Statistics Cards */}
                {statistics && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs sm:text-sm font-medium text-gray-600">Total Fuel Spend (MO)</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
                                        ${statistics.totalSpend.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-emerald-600 font-medium mt-1">
                                        ↗ +4.2% vs last month
                                    </p>
                                </div>
                                <div className="bg-blue-50 rounded-lg p-3">
                                    <FaDollarSign className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs sm:text-sm font-medium text-gray-600">Total Volume</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
                                        {statistics.totalVolume.toLocaleString()}
                                        <span className="text-sm font-normal text-gray-600"> gal</span>
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1">
                                        Avg ${statistics.avgPricePerGallon.toFixed(2)} / gal
                                    </p>
                                </div>
                                <div className="bg-emerald-50 rounded-lg p-3">
                                    <FaGasPump className="w-6 h-6 text-emerald-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs sm:text-sm font-medium text-gray-600">Fleet Efficiency</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
                                        {statistics.fleetEfficiency.toFixed(1)}
                                        <span className="text-sm font-normal text-gray-600"> MPG</span>
                                    </p>
                                    <p className="text-xs text-emerald-600 font-medium mt-1">
                                        Above industry avg
                                    </p>
                                </div>
                                <div className="bg-violet-50 rounded-lg p-3">
                                    <FaChartLine className="w-6 h-6 text-violet-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs sm:text-sm font-medium text-gray-600">Fraud Alerts</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
                                        {statistics.fraudAlerts}
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1">
                                        Suspicious transactions
                                    </p>
                                </div>
                                <div className="bg-red-50 rounded-lg p-3">
                                    <FaExclamationTriangle className="w-6 h-6 text-red-600" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-4 sm:space-x-8" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={cn(
                                'whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors',
                                activeTab === 'all'
                                    ? 'border-primary-500 text-primary-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            )}
                        >
                            All Logs
                        </button>
                        <button
                            onClick={() => setActiveTab('flagged')}
                            className={cn(
                                'whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors flex items-center gap-2',
                                activeTab === 'flagged'
                                    ? 'border-primary-500 text-primary-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            )}
                        >
                            <FaExclamationTriangle className="w-3 h-3" />
                            Flagged Alerts
                        </button>
                    </nav>
                </div>

                {/* Fuel Logs Table */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <FaSpinner className="w-8 h-8 text-primary-600 animate-spin" />
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                        <FaGasPump className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Fuel Logs</h3>
                        <p className="text-gray-600">
                            {activeTab === 'flagged' ? 'No flagged logs found' : 'No fuel logs recorded yet'}
                        </p>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-gray-700">Date</th>
                                        <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-gray-700">Vehicle</th>
                                        <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-gray-700">Driver</th>
                                        <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-gray-700">Location</th>
                                        <th className="text-right py-3 px-4 text-xs sm:text-sm font-semibold text-gray-700">Gallons</th>
                                        <th className="text-right py-3 px-4 text-xs sm:text-sm font-semibold text-gray-700">Cost</th>
                                        <th className="text-center py-3 px-4 text-xs sm:text-sm font-semibold text-gray-700">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="py-3 px-4">
                                                <div className="text-sm text-gray-900">
                                                    {new Date(log.fuelDate).toLocaleDateString()}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {new Date(log.fuelDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="bg-gray-100 rounded p-1.5">
                                                        <FaTruck className="w-3 h-3 text-gray-600" />
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {log.truck?.plateNumber || 'N/A'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="text-sm text-gray-900">
                                                    {log.driver ? `${log.driver.firstName} ${log.driver.lastName}` : 'N/A'}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="text-sm text-gray-900 max-w-xs truncate">
                                                    {log.location}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <span className="text-sm font-medium text-gray-900">
                                                    {log.gallons.toFixed(1)}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <div className="text-sm font-semibold text-gray-900">
                                                    ${log.totalCost.toFixed(2)}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    ${log.pricePerGallon.toFixed(2)} / gal
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                {getStatusBadge(log.status)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FuelManagement;
