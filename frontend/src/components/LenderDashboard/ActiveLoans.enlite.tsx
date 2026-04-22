import React, { useState } from 'react';
import {
    FileText,
    TrendingUp,
    CheckCircle2,
    DollarSign,
    ExternalLink,
    History,
    Mail,
    ShieldAlert,
    Download,
    LayoutGrid,
    List
} from 'lucide-react';
import StatCard from '../EnliteUI/Cards/StatCard';
import DataCard from '../EnliteUI/Cards/DataCard';
import EnhancedTable from '../EnliteUI/Tables/EnhancedTable';

interface Borrower {
    id: string;
    name: string;
    email: string;
    phone: string;
    company?: string;
    credit_score: number;
}

interface CargoDetails {
    type: string;
    pickup_location: string;
    delivery_location: string;
}

interface ActiveLoan {
    id: string;
    borrower: Borrower;
    cargo: CargoDetails;
    principal_amount: number;
    interest_rate: number;
    loan_term_months: number;
    outstanding_balance: number;
    amount_repaid: number;
    total_amount: number;
    next_payment_date: string;
    next_payment_amount: number;
    status: 'active' | 'overdue' | 'defaulted' | 'early_repayment';
    performance_rating: 'excellent' | 'good' | 'fair' | 'poor';
    risk_score: number;
    payments_made: number;
    payments_remaining: number;
    disbursement_date: string;
}

interface PortfolioAnalytics {
    totalActiveLoans: number;
    totalOutstanding: number;
    totalDisbursed: number;
    totalRepaid: number;
    portfolioYield: number;
    onTimePaymentRate: number;
    defaultRate: number;
}

interface ActiveLoansEnliteProps {
    loading: boolean;
    loans: ActiveLoan[];
    analytics: PortfolioAnalytics | null;
    onSort: (key: string) => void;
    sortKey: string;
    sortDirection: 'asc' | 'desc';
    onViewDetails: (loan: ActiveLoan) => void;
    onViewHistory: (loan: ActiveLoan) => void;
    onContactBorrower: (loan: ActiveLoan) => void;
    onExport: () => void;
}

const ActiveLoansEnlite: React.FC<ActiveLoansEnliteProps> = ({
    loading,
    loans,
    analytics,
    onSort,
    sortKey,
    sortDirection,
    onViewDetails,
    onViewHistory,
    onContactBorrower,
    onExport
}) => {
    const [viewMode, setViewMode] = useState<'table' | 'grouped'>('table');

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'emerald';
            case 'overdue': return 'rose';
            case 'defaulted': return 'slate';
            case 'early_repayment': return 'indigo';
            default: return 'slate';
        }
    };

    const getPerformanceColor = (rating: string) => {
        switch (rating) {
            case 'excellent': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
            case 'good': return 'text-[#345E85] bg-blue-50 border-blue-100';
            case 'fair': return 'text-amber-600 bg-amber-50 border-amber-100';
            case 'poor': return 'text-rose-600 bg-rose-50 border-rose-100';
            default: return 'text-slate-600 bg-slate-50 border-slate-100';
        }
    };

    const columns = [
        {
            key: 'borrower',
            label: 'BORROWER IDENTITY',
            render: (_: any, loan: ActiveLoan) => (
                <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-xs ${loan.performance_rating === 'excellent' ? 'bg-emerald-500' :
                        loan.performance_rating === 'good' ? 'bg-[#345E85]' :
                            loan.performance_rating === 'fair' ? 'bg-amber-500' : 'bg-rose-500'
                        }`}>
                        {loan.borrower.name.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                        <span className="font-black text-slate-900 uppercase tracking-tight text-[11px]">{loan.borrower.name}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{loan.borrower.company || 'Private Borrower'}</span>
                    </div>
                </div>
            ),
            sortable: true
        },
        {
            key: 'loan_details',
            label: 'FINANCIAL PROFILE',
            render: (_: any, loan: ActiveLoan) => (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-[11px]">RWF {(loan.principal_amount / 1000000).toFixed(1)}M</span>
                        <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-black">{loan.interest_rate}%</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{loan.loan_term_months} Months Term</span>
                </div>
            )
        },
        {
            key: 'outstanding',
            label: 'EXPOSURE INDEX',
            render: (_: any, loan: ActiveLoan) => {
                const progress = (loan.amount_repaid / loan.total_amount) * 100;
                return (
                    <div className="space-y-2 min-w-[120px]">
                        <div className="flex justify-between items-center mb-1">
                            <span className="font-black text-slate-900 text-[11px]">RWF {(loan.outstanding_balance / 1000000).toFixed(1)}M</span>
                            <span className="text-[10px] font-black text-[#345E85]">{progress.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                                className="bg-[#345E85] h-full rounded-full transition-all duration-1000"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>
                );
            },
            sortable: true
        },
        {
            key: 'next_payment',
            label: 'NEXT SETTLEMENT',
            render: (_: any, loan: ActiveLoan) => (
                <div className="flex flex-col">
                    <span className="font-black text-slate-900 text-[11px]">RWF {(loan.next_payment_amount / 1000).toFixed(0)}K</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(loan.next_payment_date).toLocaleDateString()}</span>
                </div>
            ),
            sortable: true
        },
        {
            key: 'performance',
            label: 'CREDIT RATING',
            render: (_: any, loan: ActiveLoan) => (
                <div className="flex flex-col gap-1.5">
                    <span className={`w-fit px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${getPerformanceColor(loan.performance_rating)}`}>
                        {loan.performance_rating}
                    </span>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        <ShieldAlert size={10} className={loan.risk_score > 80 ? 'text-emerald-500' : loan.risk_score > 60 ? 'text-amber-500' : 'text-rose-500'} />
                        Score: {loan.risk_score}
                    </div>
                </div>
            )
        },
        {
            key: 'actions',
            label: '',
            render: (_: any, loan: ActiveLoan) => (
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => onViewDetails(loan)}
                        className="p-2 text-slate-400 hover:text-[#345E85] hover:bg-blue-50 rounded-lg transition-all"
                        title="Overview"
                    >
                        <ExternalLink size={14} />
                    </button>
                    <button
                        onClick={() => onViewHistory(loan)}
                        className="p-2 text-slate-400 hover:text-[#345E85] hover:bg-blue-50 rounded-lg transition-all"
                        title="History"
                    >
                        <History size={14} />
                    </button>
                    <button
                        onClick={() => onContactBorrower(loan)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Contact"
                    >
                        <Mail size={14} />
                    </button>
                </div>
            )
        }
    ];

    const groupedLoans = loans.reduce((acc, loan) => {
        if (!acc[loan.status]) acc[loan.status] = [];
        acc[loan.status].push(loan);
        return acc;
    }, {} as Record<string, ActiveLoan[]>);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Portfolio Analytics */}
            {analytics && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Portfolio Exposure"
                        value={`RWF ${((analytics.totalOutstanding || 0) / 1000000).toFixed(1)}M`}
                        trend="+2.4% vs last month"
                        trendDirection="up"
                        icon={<DollarSign size={24} />}
                        color="primary"
                    />
                    <StatCard
                        title="Active Asset Count"
                        value={(analytics.totalActiveLoans || 0).toString()}
                        trend="Stable deployment"
                        trendDirection="neutral"
                        icon={<FileText size={24} />}
                        color="secondary"
                    />
                    <StatCard
                        title="Weighted Yield"
                        value={`${(analytics.portfolioYield || 0).toFixed(1)}%`}
                        trend="+0.5% optimization"
                        trendDirection="up"
                        icon={<TrendingUp size={24} />}
                        color="success"
                    />
                    <StatCard
                        title="Collection Index"
                        value={`${(analytics.onTimePaymentRate || 0).toFixed(1)}%`}
                        trend="-1.2% alert"
                        trendDirection="down"
                        icon={<CheckCircle2 size={24} />}
                        color="warning"
                    />
                </div>
            )}

            {/* Main Content Area */}
            <DataCard
                title="Portfolio Management Console"
                actions={
                    <div className="flex items-center gap-3">
                        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                            <button
                                onClick={() => setViewMode('table')}
                                className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-[#345E85]' : 'text-slate-400'}`}
                            >
                                <List size={14} />
                            </button>
                            <button
                                onClick={() => setViewMode('grouped')}
                                className={`p-1.5 rounded-lg transition-all ${viewMode === 'grouped' ? 'bg-white shadow-sm text-[#345E85]' : 'text-slate-400'}`}
                            >
                                <LayoutGrid size={14} />
                            </button>
                        </div>
                        <button
                            onClick={onExport}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                        >
                            <Download size={14} /> Export Portfolio
                        </button>
                    </div>
                }
            >
                <div className="space-y-6">
                    {viewMode === 'table' ? (
                        <EnhancedTable
                            columns={columns}
                            data={loans}
                            loading={loading}
                            onSort={onSort}
                            sortKey={sortKey}
                            sortDirection={sortDirection}
                        />
                    ) : (
                        <div className="space-y-8">
                            {Object.entries(groupedLoans).map(([status, statusLoans]) => (
                                <div key={status} className="space-y-4">
                                    <div className="flex items-center gap-4 px-2">
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white bg-${getStatusColor(status)}-500 shadow-lg shadow-${getStatusColor(status)}-100`}>
                                            <ShieldAlert size={16} />
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-tighter">{status} OPERATIONS</h3>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{statusLoans.length} Active Assets Assigned</p>
                                        </div>
                                        <div className="flex-1 border-t border-slate-100 border-dashed mx-4"></div>
                                        <div className="text-right">
                                            <p className="text-xs font-black text-slate-900 uppercase">RWF {(statusLoans.reduce((sum, l) => sum + l.outstanding_balance, 0) / 1000000).toFixed(1)}M</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Total Exposure</p>
                                        </div>
                                    </div>
                                    <EnhancedTable
                                        columns={columns}
                                        data={statusLoans}
                                        loading={loading}
                                        onSort={onSort}
                                        sortKey={sortKey}
                                        sortDirection={sortDirection}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DataCard>
        </div>
    );
};

export default ActiveLoansEnlite;
