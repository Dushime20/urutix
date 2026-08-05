import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaDollarSign, FaArrowRight, FaArrowUp,
    FaCreditCard, FaExchangeAlt, FaWallet
} from 'react-icons/fa';
import { Line } from 'react-chartjs-2';

const FinancialWidget: React.FC = () => {
    const navigate = useNavigate();

    // Mock data - replace with actual API call
    const stats = {
        totalRevenue: 45200,
        todayRevenue: 3420,
        weekRevenue: 18900,
        monthRevenue: 45200,
        transactions: 1284,
        pending: 42,
        escrowBalance: 12500,
        growth: 23.1,
    };

    const chartData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
            {
                label: 'Revenue',
                data: [3200, 4100, 3800, 5200, 4700, 5800, 5400],
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                borderWidth: 2,
                pointRadius: 0,
                fill: true,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#1e293b',
                padding: 8,
                cornerRadius: 6,
                displayColors: false,
            },
        },
        scales: {
            x: {
                display: false,
            },
            y: {
                display: false,
            },
        },
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                        <FaDollarSign className="text-emerald-600" size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-100">Financial Overview</h3>
                        <p className="text-xs text-slate-500">Revenue & transactions</p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/admin/financial')}
                    className="text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                    View All <FaArrowRight size={12} />
                </button>
            </div>

            {/* Main Revenue */}
            <div className="mb-6">
                <div className="flex items-baseline gap-2 mb-1">
                    <div className="text-3xl font-black text-slate-800 dark:text-slate-100">
                        ${(stats.monthRevenue / 1000).toFixed(1)}K
                    </div>
                    <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                        <FaArrowUp size={10} />
                        {stats.growth}%
                    </div>
                </div>
                <div className="text-xs text-slate-500 font-medium">Monthly Revenue</div>
            </div>

            {/* Chart */}
            <div className="h-24 mb-6">
                <Line data={chartData} options={chartOptions} />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="text-center p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <div className="text-lg font-black text-slate-800 dark:text-slate-100">${(stats.todayRevenue / 1000).toFixed(1)}K</div>
                    <div className="text-[10px] text-slate-500 font-medium mt-0.5">Today</div>
                </div>
                <div className="text-center p-2 bg-blue-50 rounded-lg">
                    <div className="text-lg font-black text-blue-600">{stats.transactions}</div>
                    <div className="text-[10px] text-blue-600 font-medium mt-0.5">Transactions</div>
                </div>
                <div className="text-center p-2 bg-amber-50 rounded-lg">
                    <div className="text-lg font-black text-amber-600">{stats.pending}</div>
                    <div className="text-[10px] text-amber-600 font-medium mt-0.5">Pending</div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <div className="flex items-center gap-2">
                        <FaWallet className="text-purple-500" size={14} />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Escrow Balance</span>
                    </div>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100">${(stats.escrowBalance / 1000).toFixed(1)}K</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <div className="flex items-center gap-2">
                        <FaCreditCard className="text-blue-500" size={14} />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Avg. Transaction</span>
                    </div>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100">${((stats.monthRevenue / stats.transactions)).toFixed(0)}</span>
                </div>
            </div>

            {/* Quick Action */}
            <button
                onClick={() => navigate('/admin/financial')}
                className="w-full mt-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors"
            >
                <FaExchangeAlt size={14} /> View Transactions
            </button>
        </div>
    );
};

export default FinancialWidget;
