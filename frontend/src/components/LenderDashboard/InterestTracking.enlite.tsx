import React, { useState } from 'react';
import {
    Activity,
    TrendingUp,
    Percent,
    DollarSign,
    Calculator,
    BarChart3,
    Search,
    Filter,
    ArrowUpRight,
    ExternalLink,
    Download,
    Calendar,
    Clock,
    User,
    ArrowUp,
    CheckCircle2,
    RotateCcw
} from 'lucide-react';
import StatCard from '../EnliteUI/Cards/StatCard';
import DataCard from '../EnliteUI/Cards/DataCard';
import EnhancedTable from '../EnliteUI/Tables/EnhancedTable';

export interface InterestEarning {
    id: string;
    loanId: string;
    borrowerName: string;
    principalAmount: number;
    interestRate: number;
    accruedInterest: number;
    paidInterest: number;
    outstandingInterest: number;
    startDate: string;
    maturityDate: string;
    paymentFrequency: string;
    status: 'active' | 'paid' | 'overdue' | 'defaulted';
    cargoType: string;
    riskCategory: 'low' | 'medium' | 'high';
    nextPaymentDate: string;
    daysActive: number;
}

interface InterestTrackingEnliteProps {
    loading: boolean;
    data: InterestEarning[];
    metrics: {
        totalInterestEarned: number;
        averageInterestRate: number;
        totalOutstandingInterest: number;
        collectionEfficiency: number;
    };
    onViewDetails: (loan: InterestEarning) => void;
}

const InterestTrackingEnlite: React.FC<InterestTrackingEnliteProps> = ({
    loading,
    data,
    metrics,
    onViewDetails
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'paid': return 'bg-blue-50 text-[#345E85] border-blue-100';
            case 'overdue': return 'bg-rose-50 text-rose-700 border-rose-100';
            default: return 'bg-slate-50 text-slate-700 border-slate-100';
        }
    };

    const columns = [
        {
            key: 'loan',
            label: 'LOAN & ENTITY',
            render: (_: any, item: InterestEarning) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                        <User size={18} className="text-[#345E85]" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-black text-slate-900 uppercase text-[11px]">{item.borrowerName}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{item.loanId}</span>
                    </div>
                </div>
            )
        },
        {
            key: 'interest_rate',
            label: 'YIELD RATE',
            render: (_: any, item: InterestEarning) => (
                <div className="flex flex-col">
                    <span className="font-black text-[#345E85] text-[13px]">{item.interestRate.toFixed(1)}%</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{item.paymentFrequency}</span>
                </div>
            )
        },
        {
            key: 'accrued',
            label: 'ACCRUED / PAID',
            render: (_: any, item: InterestEarning) => (
                <div className="flex flex-col">
                    <span className="font-black text-slate-900 text-[11px]">RWF {(item.accruedInterest / 1000).toFixed(0)}K</span>
                    <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Paid: {(item.paidInterest / 1000).toFixed(0)}K</span>
                </div>
            )
        },
        {
            key: 'schedule',
            label: 'NEXT CYCLE',
            render: (_: any, item: InterestEarning) => (
                <div className="flex items-center gap-2">
                    <Calendar size={12} className="text-slate-400" />
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{item.nextPaymentDate}</span>
                </div>
            )
        },
        {
            key: 'status',
            label: 'STATE',
            render: (_: any, item: InterestEarning) => (
                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black border uppercase ${getStatusColor(item.status)}`}>
                    {item.status}
                </span>
            )
        },
        {
            key: 'actions',
            label: '',
            render: (_: any, item: InterestEarning) => (
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => onViewDetails(item)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-[#345E85] text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-opacity-90 transition-all shadow-md shadow-blue-100"
                    >
                        Audit <ArrowUpRight size={12} />
                    </button>
                </div>
            )
        }
    ];

    const filteredData = data.filter(item => {
        const matchesSearch = item.borrowerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.loanId.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Core Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Interest"
                    value={`RWF ${(metrics.totalInterestEarned / 1000).toFixed(0)}K`}
                    subtitle="Realized Revenue"
                    icon={<DollarSign size={24} />}
                    color="success"
                />
                <StatCard
                    title="Avg Yield"
                    value={`${metrics.averageInterestRate.toFixed(1)}%`}
                    subtitle="Portfolio Performance"
                    icon={<Percent size={24} />}
                    color="primary"
                />
                <StatCard
                    title="Outstanding"
                    value={`RWF ${(metrics.totalOutstandingInterest / 1000).toFixed(0)}K`}
                    subtitle="Current Receivables"
                    icon={<Clock size={24} />}
                    color="warning"
                />
                <StatCard
                    title="Efficiency"
                    value={`${metrics.collectionEfficiency.toFixed(1)}%`}
                    subtitle="Collection Rate"
                    icon={<Activity size={24} />}
                    color="secondary"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                {/* Left Sidebar Info */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-slate-900 rounded-3xl p-6 text-white overflow-hidden relative group shadow-2xl shadow-slate-200">
                        <div className="relative z-10">
                            <TrendingUp className="mb-4 text-emerald-400" size={32} />
                            <h4 className="text-sm font-black uppercase tracking-tighter leading-tight">Revenue Projection</h4>
                            <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest leading-relaxed">
                                System projects a 12.4% increase in interest revenue for the upcoming quarter based on current compounding nodes.
                            </p>
                            <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                                <span className="text-[9px] font-black text-slate-500 uppercase">Confidence Score</span>
                                <span className="text-[10px] font-black text-emerald-400">94.2%</span>
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-1000" />
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                        <Calculator className="mb-3 text-[#345E85]" size={20} />
                        <h4 className="text-[10px] font-black uppercase text-slate-900 tracking-widest">Yield Optimization</h4>
                        <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-widest leading-relaxed">
                            Dynamic interest rates are currently adjusted for peak liquidity periods across the East African transport corridor.
                        </p>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-3">
                    <DataCard title="INTEREST REVENUE TERMINAL" subtitle="Real-time tracking of accrued interest and scheduled payouts">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between gap-4 py-2 mt-2">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="FILTER ASSETS..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black tracking-widest uppercase focus:ring-2 focus:ring-[#345E85] focus:outline-none transition-all"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Filter size={14} className="text-slate-400" />
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black tracking-widest uppercase focus:outline-none"
                                    >
                                        <option value="all">ALL STATUS</option>
                                        <option value="active">ACTIVE</option>
                                        <option value="paid">PAID</option>
                                        <option value="overdue">OVERDUE</option>
                                    </select>
                                </div>
                            </div>

                            <EnhancedTable
                                columns={columns}
                                data={filteredData}
                                loading={loading}
                                emptyMessage="No interest records found for this timeframe"
                            />
                        </div>
                    </DataCard>
                </div>
            </div>
        </div>
    );
};

export default InterestTrackingEnlite;
