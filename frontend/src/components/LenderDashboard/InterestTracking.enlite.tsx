import React, { useState } from 'react';
import {
    Activity,
    TrendingUp,
    DollarSign,
    Search,
    Filter,
    ArrowUpRight,
    Calendar,
    User,
    AlertCircle,
    Clock,
    Banknote,
} from 'lucide-react';
import { StatCard } from '../EnliteUI';
import DataCard from '../EnliteUI/Cards/DataCard';
import EnhancedTable from '../EnliteUI/Tables/EnhancedTable';
import LoanDetailModal from './LoanDetailModal';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InterestLoan {
    loanId: string;
    borrowerName: string | null;
    businessName: string | null;
    requestedAmount: number | null;
    approvedAmount: number | null;
    status: string;
    dueDate: string | null;
    createdAt: string | null;
    contractedInterest: number | null;
    totalInterestPaid: number;
    outstandingInterest: number | null;
    totalPrincipalPaid: number;
    totalRepaid: number;
    repaymentCount: number;
    purpose: string | null;
    _rawData?: any;
}

interface InterestTrackingEnliteProps {
    loading: boolean;
    loans: InterestLoan[];
    summary: {
        totalLoans: number;
        totalPrincipalDeployed: number;
        totalInterestCollected: number;
        totalContractedInterest: number | null;
        totalOutstandingInterest: number | null;
        collectionEfficiency: number | null;
        overdueCount: number;
    } | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const statusStyle: Record<string, string> = {
    pending:   'bg-amber-50 text-amber-700 border-amber-100',
    approved:  'bg-emerald-50 text-emerald-700 border-emerald-100',
    rejected:  'bg-rose-50 text-rose-700 border-rose-100',
    disbursed: 'bg-blue-50 text-blue-700 border-blue-100',
    repaid:    'bg-green-50 text-green-700 border-green-100',
    defaulted: 'bg-red-50 text-red-700 border-red-100',
    failed:    'bg-slate-50 text-slate-600 border-slate-100',
};

const formatDate = (iso: string | null): string => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
    });
};

const isOverdue = (dueDate: string | null, status: string): boolean => {
    if (!dueDate || status === 'repaid') return false;
    return new Date(dueDate) < new Date();
};

// ─── Component ────────────────────────────────────────────────────────────────

const InterestTrackingEnlite: React.FC<InterestTrackingEnliteProps> = ({
    loading,
    loans,
    summary,
}) => {
    const { format: fmtCurrency, compact: compactAmount } = useCurrencyFormat();
    const formatAmount = (amount: number | null): string =>
        amount === null ? '—' : fmtCurrency(amount);

    const [searchTerm, setSearchTerm]     = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [detailLoan, setDetailLoan]     = useState<any | null>(null);

    const filtered = loans.filter(l => {
        const q = searchTerm.toLowerCase();
        const matchSearch =
            (l.borrowerName ?? '').toLowerCase().includes(q) ||
            (l.businessName ?? '').toLowerCase().includes(q) ||
            l.loanId.toLowerCase().includes(q);
        const matchStatus = statusFilter === 'all' || l.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const columns = [
        {
            key: 'loan',
            label: 'Borrower',
            render: (_: any, l: InterestLoan) => (
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs ring-2 ring-white shadow-sm border border-slate-200 flex-shrink-0">
                        <User size={14} className="text-[#2c5173]" />
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-slate-900 text-sm truncate">
                            {l.borrowerName ?? (
                                <span className="text-slate-400 italic font-medium">No name on record</span>
                            )}
                        </p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium font-mono">
                            {l.loanId.substring(0, 8)}…
                        </p>
                    </div>
                </div>
            ),
        },
        {
            key: 'principal',
            label: 'Principal',
            render: (_: any, l: InterestLoan) => (
                <div className="min-w-0">
                    <p className="font-semibold text-slate-900 text-sm">
                        {formatAmount(l.approvedAmount ?? l.requestedAmount)}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium truncate max-w-[140px]">
                        {l.purpose ?? '—'}
                    </p>
                </div>
            ),
        },
        {
            key: 'interest_paid',
            label: 'Interest Paid',
            render: (_: any, l: InterestLoan) => (
                <div className="min-w-0">
                    <p className="font-semibold text-emerald-600 text-sm">
                        {formatAmount(l.totalInterestPaid > 0 ? l.totalInterestPaid : null)}
                    </p>
                    {l.contractedInterest !== null && (
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                            of {fmtCurrency(l.contractedInterest)} contracted
                        </p>
                    )}
                </div>
            ),
        },
        {
            key: 'outstanding',
            label: 'Outstanding',
            render: (_: any, l: InterestLoan) => (
                <span className={`font-semibold text-sm ${
                    l.outstandingInterest !== null && l.outstandingInterest > 0
                        ? isOverdue(l.dueDate, l.status) ? 'text-rose-600' : 'text-amber-600'
                        : 'text-slate-400'
                }`}>
                    {l.outstandingInterest !== null
                        ? l.outstandingInterest > 0
                            ? fmtCurrency(l.outstandingInterest)
                            : 'Settled'
                        : '—'}
                </span>
            ),
        },
        {
            key: 'repayments',
            label: 'Repayments',
            render: (_: any, l: InterestLoan) => (
                <div className="min-w-0">
                    <p className="font-semibold text-slate-900 text-sm">
                        {l.repaymentCount} payment{l.repaymentCount !== 1 ? 's' : ''}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                        {fmtCurrency(l.totalRepaid)} total
                    </p>
                </div>
            ),
        },
        {
            key: 'due',
            label: 'Due Date',
            render: (_: any, l: InterestLoan) => (
                <div className="flex items-center gap-1.5">
                    <Calendar size={11} className={isOverdue(l.dueDate, l.status) ? 'text-rose-500' : 'text-slate-400'} />
                    <span className={`text-sm font-medium whitespace-nowrap ${
                        isOverdue(l.dueDate, l.status) ? 'text-rose-600 font-semibold' : 'text-slate-600'
                    }`}>
                        {formatDate(l.dueDate)}
                        {isOverdue(l.dueDate, l.status) && (
                            <span className="ml-1 text-[9px] font-bold uppercase text-rose-500">Overdue</span>
                        )}
                    </span>
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (_: any, l: InterestLoan) => (
                <span className={`inline-flex px-2.5 py-1 rounded-lg text-[9px] font-bold border uppercase tracking-wider ${statusStyle[l.status] ?? statusStyle.pending}`}>
                    {l.status}
                </span>
            ),
        },
        {
            key: 'actions',
            label: '',
            render: (_: any, l: InterestLoan) => (
                <div className="flex justify-end">
                    <button
                        onClick={() => setDetailLoan(l._rawData)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#2c5173] hover:bg-[#1e3850] text-white text-[9px] font-bold uppercase tracking-wider transition-colors shadow-sm"
                    >
                        Audit <ArrowUpRight size={12} />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-12">
            {/* Analytics Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Interest Collected"
                    value={summary ? formatAmount(summary.totalInterestCollected > 0 ? summary.totalInterestCollected : null) : '—'}
                    subtitle={summary ? `Across ${summary.totalLoans} loan${summary.totalLoans !== 1 ? 's' : ''}` : 'Loading...'}
                    icon={<DollarSign size={18} />}
                    color="primary"
                    variant="classic"
                    loading={loading && !summary}
                />
                <StatCard
                    title="Outstanding Interest"
                    value={summary?.totalOutstandingInterest != null
                        ? formatAmount(summary.totalOutstandingInterest > 0 ? summary.totalOutstandingInterest : null)
                        : '—'}
                    subtitle={summary?.totalOutstandingInterest != null
                        ? summary.totalOutstandingInterest > 0 ? 'Receivable' : 'All settled'
                        : 'No contracted interest'}
                    icon={<Clock size={18} />}
                    color="primary"
                    variant="classic"
                    loading={loading && !summary}
                />
                <StatCard
                    title="Collection Efficiency"
                    value={summary?.collectionEfficiency != null
                        ? `${summary.collectionEfficiency.toFixed(1)}%`
                        : '—'}
                    subtitle={summary?.collectionEfficiency != null
                        ? 'Interest paid vs contracted'
                        : 'No contracted interest data'}
                    icon={<Activity size={18} />}
                    color="primary"
                    variant="classic"
                    loading={loading && !summary}
                />
                <StatCard
                    title="Principal Deployed"
                    value={summary ? compactAmount(summary.totalPrincipalDeployed || 0) : '—'}
                    subtitle={summary != null
                        ? summary.overdueCount > 0
                            ? `${summary.overdueCount} overdue loan${summary.overdueCount !== 1 ? 's' : ''}`
                            : 'None overdue'
                        : 'Loading...'}
                    icon={summary?.overdueCount ? <AlertCircle size={18} /> : <Banknote size={18} />}
                    color="primary"
                    variant="classic"
                    loading={loading && !summary}
                />
            </div>

            {/* Interest Records */}
            <DataCard
                title="Interest Revenue"
                subtitle="Per-loan interest breakdown from verified repayment records"
                icon={<TrendingUp className="w-5 h-5" />}
                headerColor="primary"
                actions={
                    <div className="flex items-center gap-2">
                        <div className="relative hidden md:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" size={14} />
                            <input
                                type="text"
                                placeholder="SEARCH LOANS..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-48 lg:w-56 pl-9 pr-3 py-1.5 bg-white/15 border border-white/20 rounded-md text-[10px] font-bold tracking-widest uppercase text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
                            />
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Filter size={14} className="text-white/70" />
                            <select
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                                className="px-2.5 py-1.5 bg-white/15 border border-white/20 rounded-md text-[10px] font-bold tracking-widest uppercase text-white focus:outline-none"
                            >
                                <option value="all" className="text-slate-900">ALL STATUS</option>
                                <option value="pending" className="text-slate-900">PENDING</option>
                                <option value="approved" className="text-slate-900">APPROVED</option>
                                <option value="disbursed" className="text-slate-900">DISBURSED</option>
                                <option value="repaid" className="text-slate-900">REPAID</option>
                                <option value="defaulted" className="text-slate-900">DEFAULTED</option>
                            </select>
                        </div>
                    </div>
                }
            >
                <div className="space-y-4">
                    <div className="relative md:hidden">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search loans..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-slate-600 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2c5173]/20 focus:border-[#2c5173]"
                        />
                    </div>

                    <EnhancedTable
                        columns={columns}
                        data={filtered}
                        loading={loading}
                        striped
                        hoverable
                        emptyMessage="No interest records found"
                    />
                </div>
            </DataCard>

            {detailLoan && (
                <LoanDetailModal
                    loan={detailLoan}
                    onClose={() => setDetailLoan(null)}
                />
            )}
        </div>
    );
};

export default InterestTrackingEnlite;
