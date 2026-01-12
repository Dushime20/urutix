import React from 'react';
import { FaTools, FaExclamationTriangle, FaCheckCircle, FaMoneyBillWave } from 'react-icons/fa';

interface MaintenanceStatsCardsProps {
    stats: {
        totalCost: number;
        activeRepairs: number;
        upcomingServices: number;
        healthScore: number;
    };
    loading?: boolean;
}

const MaintenanceStatsCards: React.FC<MaintenanceStatsCardsProps> = ({ stats, loading }) => {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse h-24"></div>
                ))}
            </div>
        );
    }

    const cards = [
        {
            title: 'Monthly Maintenance Cost',
            value: `$${stats.totalCost.toLocaleString()}`,
            icon: FaMoneyBillWave,
            color: 'text-green-600',
            bg: 'bg-green-100'
        },
        {
            title: 'Active Repairs',
            value: stats.activeRepairs,
            icon: FaTools,
            color: 'text-blue-600',
            bg: 'bg-blue-100'
        },
        {
            title: 'Upcoming Services',
            value: stats.upcomingServices,
            icon: FaExclamationTriangle,
            color: 'text-orange-600',
            bg: 'bg-orange-100'
        },
        {
            title: 'Fleet Health Score',
            value: `${stats.healthScore}%`,
            icon: FaCheckCircle,
            color: stats.healthScore > 90 ? 'text-green-600' : (stats.healthScore > 70 ? 'text-yellow-600' : 'text-red-600'),
            bg: stats.healthScore > 90 ? 'bg-green-100' : (stats.healthScore > 70 ? 'bg-yellow-100' : 'bg-red-100')
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {cards.map((card, index) => (
                <div key={index} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500 mb-1">{card.title}</p>
                        <h3 className="text-2xl font-bold text-slate-800">{card.value}</h3>
                    </div>
                    <div className={`p-3 rounded-full ${card.bg}`}>
                        <card.icon className={`text-xl ${card.color}`} />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default MaintenanceStatsCards;
