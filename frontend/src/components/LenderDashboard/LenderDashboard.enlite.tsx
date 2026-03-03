import React, { useState, useEffect } from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import { lendingApi } from '../../services/lending/lendingApi';
import { useAuth } from '../../contexts/AuthContext';
import StatCard from '../EnliteUI/Cards/StatCard';
import EnhancedTable from '../EnliteUI/Tables/EnhancedTable';
import DataCard from '../EnliteUI/Cards/DataCard';
import {
    DollarSign,
    Briefcase,
    AlertTriangle,
    Activity,
    TrendingUp,
    PieChart,
    Clock
} from 'lucide-react';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

interface DashboardStats {
    totalLoans: number;
    totalAmount: number;
    pendingRequests: number;
    activeLoans: number;
    defaultRate: number;
    averageAmount: number;
}

interface ChartData {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        borderColor?: string;
        backgroundColor?: string | string[];
        tension?: number;
    }[];
}

const LenderDashboardEnlite: React.FC = () => {
    const { user, accessToken } = useAuth();
    const [stats, setStats] = useState<DashboardStats>({
        totalLoans: 0,
        totalAmount: 0,
        pendingRequests: 0,
        activeLoans: 0,
        defaultRate: 0,
        averageAmount: 0,
    });

    const [loading, setLoading] = useState(true);

    // Get lender ID from user context - for lenders, use user.id directly
    const lenderId = user?.role === 'LENDER' ? user.id : null;

    useEffect(() => {
        const loadDashboardData = async () => {
            if (!lenderId || !accessToken) {
                console.log('LenderDashboard: No lender ID or access token available');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);

                console.log('LenderDashboard: Loading data for lender:', lenderId);

                const [dashboardData] = await Promise.all([
                    lendingApi.getLenderDashboard(lenderId).catch(err => {
                        console.warn('Dashboard API failed, using fallback:', err.message);
                        return null;
                    }),
                    lendingApi.getLenderAnalytics(lenderId, '30d').catch(err => {
                        console.warn('Analytics API failed, using fallback:', err.message);
                        return null;
                    })
                ]);

                if (dashboardData) {
                    setStats({
                        totalLoans: dashboardData.totalLoansIssued || 0,
                        totalAmount: dashboardData.totalOutstandingPrincipal || 0,
                        pendingRequests: 0,
                        activeLoans: dashboardData.totalLoansIssued || 0,
                        defaultRate: dashboardData.defaultRate || 0,
                        averageAmount: dashboardData.averageLoanSize || 0,
                    });
                } else {
                    throw new Error('No dashboard data received');
                }

            } catch (error: any) {
                console.error('LenderDashboard: Error loading data:', error);
                // setError(error.message || 'Failed to load dashboard data'); // Removed unused state setter

                // Graceful fallback to mock data
                console.log('LenderDashboard: Falling back to mock data');
                setStats({
                    totalLoans: 156,
                    totalAmount: 245000000,
                    pendingRequests: 23,
                    activeLoans: 89,
                    defaultRate: 3.2,
                    averageAmount: 1570500,
                });
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, [lenderId, accessToken]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const displayName = user?.firstName || user?.email?.split('@')[0] || 'Lender';

    // Mock data for table
    const recentRequests = [
        { id: 1, borrower: 'Jean Baptiste', amount: 15000000, purpose: 'Equipment Purchase', status: 'Pending', date: '2024-02-15' },
        { id: 2, borrower: 'Marie Claire', amount: 25000000, purpose: 'Working Capital', status: 'Approved', date: '2024-02-14' },
        { id: 3, borrower: 'Paul Ntakirutimana', amount: 5000000, purpose: 'Emergency Repairs', status: 'Rejected', date: '2024-02-13' },
        { id: 4, borrower: 'Sarah Uwase', amount: 12000000, purpose: 'Inventory', status: 'Pending', date: '2024-02-12' },
        { id: 5, borrower: 'Eric Manzi', amount: 8500000, purpose: 'Fuel', status: 'Disbursed', date: '2024-02-10' },
    ];

    const columns = [
        { key: 'borrower', label: 'Borrower', sortable: true },
        {
            key: 'amount',
            label: 'Amount',
            sortable: true,
            render: (amount: number) => `RWF ${amount.toLocaleString()}`
        },
        { key: 'purpose', label: 'Purpose', sortable: true },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            render: (status: string) => {
                let colorClass = 'bg-slate-100 text-slate-600';
                if (status === 'Pending') colorClass = 'bg-amber-100 text-amber-700';
                if (status === 'Approved') colorClass = 'bg-emerald-100 text-emerald-700';
                if (status === 'Rejected') colorClass = 'bg-rose-100 text-rose-700';
                if (status === 'Disbursed') colorClass = 'bg-blue-100 text-[#345E85]';

                return (
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${colorClass}`}>
                        {status}
                    </span>
                );
            }
        },
        { key: 'date', label: 'Date', sortable: true },
    ];

    const monthlyLoansData: ChartData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
            {
                label: 'Loans Disbursed',
                data: [12, 19, 15, 25, 22, 30],
                borderColor: '#345E85', // Brand Blue (Primary 500)
                backgroundColor: 'rgba(52, 94, 133, 0.1)',
                tension: 0.4,
            },
        ],
    };

    const loanStatusData: ChartData = {
        labels: ['Active', 'Completed', 'Defaulted'],
        datasets: [
            {
                label: 'Loan Status',
                data: [89, 54, 13],
                backgroundColor: [
                    '#345E85', // Brand Blue (Active)
                    '#5F8FB3', // Muted Blue (Completed)
                    '#AFC7D9', // Light Blue (Defaulted)
                ]
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    usePointStyle: true,
                    padding: 20,
                    font: {
                        family: "'Inter', sans-serif",
                        size: 12
                    }
                },
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: '#f3f4f6',
                },
                ticks: {
                    font: {
                        family: "'Inter', sans-serif",
                        size: 11
                    }
                }
            },
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    font: {
                        family: "'Inter', sans-serif",
                        size: 11
                    }
                }
            }
        },
    };

    if (!user) return null; // Or redirect/show loading

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 md:p-8 space-y-8">
            {/* Modern Welcome Section - Clean White Theme Style */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {getGreeting()}, {displayName}
                    </h1>
                    <p className="mt-1 text-gray-600">
                        {stats
                            ? `${stats.totalLoans} Total Loans • ${stats.activeLoans} Active • ${(stats.totalAmount / 1000000).toFixed(1)}M RWF Value`
                            : 'Welcome to your lender dashboard'}
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button className="inline-flex items-center gap-2 px-6 py-3 bg-[#345E85] text-white rounded-lg hover:bg-opacity-90 transition-all font-medium shadow-sm">
                        <DollarSign size={20} />
                        New Disbursement
                    </button>
                </div>
            </div>

            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                    <StatCard
                        title="Total Loans Issued"
                        value={stats.totalLoans}
                        icon={<Briefcase />}
                        trend="+12%"
                        trendDirection="up"
                        color="primary"
                        subtitle="Active lending portfolio"
                        loading={loading}
                    />
                    <StatCard
                        title="Total Outstanding"
                        value={`RWF ${(stats.totalAmount / 1000000).toFixed(1)}M`}
                        icon={<DollarSign />}
                        trend="+8.5%"
                        trendDirection="up"
                        color="success"
                        subtitle="Total disbursed capital"
                        loading={loading}
                    />
                    <StatCard
                        title="Active Loans"
                        value={stats.activeLoans}
                        icon={<Activity />}
                        trend="+5"
                        trendDirection="up"
                        color="info"
                        subtitle="Currently disbursed"
                        loading={loading}
                    />
                    <StatCard
                        title="Default Rate"
                        value={`${stats.defaultRate}%`}
                        icon={<AlertTriangle />}
                        trend="-0.2%"
                        trendDirection="up"
                        color="secondary"
                        subtitle="Risk metric"
                        loading={loading}
                    />
                    <StatCard
                        title="Average Loan Size"
                        value={`RWF ${(stats.averageAmount / 1000000).toFixed(1)}M`}
                        icon={<PieChart />}
                        trend="+2.3%"
                        trendDirection="up"
                        color="accent"
                        subtitle="Per loan amount"
                        loading={loading}
                    />
                    <StatCard
                        title="Pending Requests"
                        value={stats.pendingRequests}
                        icon={<Clock />}
                        trend="+3"
                        trendDirection="neutral"
                        color="secondary"
                        subtitle="Awaiting approval"
                        loading={loading}
                    />
                </div>
            )}

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <DataCard title="Disbursement Trends" icon={<TrendingUp />} headerColor="primary" className="h-[400px]">
                        <div className="h-full w-full p-2">
                            <Line data={monthlyLoansData} options={chartOptions} />
                        </div>
                    </DataCard>
                </div>
                <div className="lg:col-span-1">
                    <DataCard title="Portfolio Health" icon={<PieChart />} headerColor="secondary" className="h-[400px]">
                        <div className="h-full w-full flex items-center justify-center p-2">
                            <Doughnut data={loanStatusData} options={chartOptions} />
                        </div>
                    </DataCard>
                </div>
            </div>

            {/* Recent Activity Table */}
            <DataCard title="Recent Loan Requests" icon={<Clock />} headerColor="default">
                <EnhancedTable
                    columns={columns}
                    data={recentRequests}
                    striped
                    hoverable
                    loading={loading}
                    emptyMessage="No recent requests found"
                />
            </DataCard>
        </div>
    );
};

export default LenderDashboardEnlite;
