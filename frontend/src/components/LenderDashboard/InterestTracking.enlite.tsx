import React, { useState } from 'react';
import {
    Activity,
    TrendingUp,
    Percent,
    DollarSign,
    Search,
    Filter,
    ArrowUpRight,
    Calendar,
    User,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Clock,
} from 'lucide-react';
import StatCard from '../EnliteUI/Cards/StatCard';
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
    // Interest fields — null means not yet contracted / not calculable
    contractedInterest: number | null;
    totalInterestPaid: number;
    outstandingInterest: number | null;
    // Repayment totals
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
    const { format: fmtCurrency } = useCurrencyFormat();
    // Wrapper that handles null gracefully
    const formatAmount = (amount: number | null): string => amount === null ? '—' : fmtCurrency(amount);

    const [searchTerm, setSearchTerm]     = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [detailLoan, setDetailLoan]     = useState<any | null>(null);

    // ── Filtered table data ───────────────────────────────────────────────────

    const filtered = loans.filter(l => {
        const q = searchTerm.toLowerCase();
        const matchSearch =
            (l.borrowerName ?? '').toLowerCase().includes(q) ||
            (l.businessName ?? '').toLowerCase().includes(q) ||
            l.loanId.toLowerCase().includes(q);
        const matchStatus = statusFilter === 'all' || l.status === statusFilter;
        return matchSearch && matchStatus;
    });

    // ── Table columns ─────────────────────────────────────────────────────────

    const columns = [
        {
            key: 'loan',
            label: 'LOAN & BORROWER',
            render: (_: any, l: InterestLoan) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 flex-shrink-0">
                        <User size={18} className="text-[#345E85]" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-black text-slate-900 uppercase text-[11px] truncate">
                            {l.borrowerName ?? (
                                <span className="text-slate-400 italic normal-case font-medium">No name on record</span>
                            )}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 font-mono">
                            {l.loanId.substring(0, 8)}…
                        </span>
                    </div>
                </div>
            ),
        },
        {
            key: 'principal',
            label: 'PRINCIPAL',
            render: (_: any, l: InterestLoan) => (
                <div className="flex flex-col">
                    <span className="font-black text-slate-900 text-[11px]">
                        {fmtCurrency(l.approvedAmount ?? l.requestedAmount)}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase truncate max-w-[140px]">
                        {l.purpose ?? '—'}
                    </span>
                </div>
            ),
        },
        {
            key: 'interest_paid',
            label: 'INTEREST PAID',
            render: (_: any, l: InterestLoan) => (
                <div className="flex flex-col">
                    <span className="font-black text-emerald-600 text-[12px]">
                        {fmtCurrency(l.totalInterestPaid > 0 ? l.totalInterestPaid : null)}
                    </span>
                    {l.contractedInterest !== null && (
                        <span className="text-[9px] font-bold text-slate-400 uppercase">
                            of {fmtCurrency(l.contractedInterest)} contracted
                        </span>
                    )}
                </div>
            ),
        },
        {
            key: 'outstanding',
            label: 'OUTSTANDING',
            render: (_: any, l: InterestLoan) => (
                <span className={`font-black text-[12px] ${
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
            label: 'REPAYMENTS',
            render: (_: any, l: InterestLoan) => (
                <div className="flex flex-col">
                    <span className="font-black text-slate-900 text-[11px]">
                        {l.repaymentCount} payment{l.repaymentCount !== 1 ? 's' : ''}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">
                        {fmtCurrency(l.totalRepaid)} total
                    </span>
                </div>
            ),
        },
        {
            key: 'due',
            label: 'DUE DATE',
            render: (_: any, l: InterestLoan) => (
                <div className="flex items-center gap-1.5">
                    <Calendar size={11} className={isOverdue(l.dueDate, l.status) ? 'text-rose-500' : 'text-slate-400'} />
                    <span className={`text-[10px] font-semibold whitespace-nowrap ${
                        isOverdue(l.dueDate, l.status) ? 'text-rose-600 font-black' : 'text-slate-600'
                    }`}>
                        {formatDate(l.dueDate)}
                        {isOverdue(l.dueDate, l.status) && (
                            <span className="ml-1 text-[8px] font-black uppercase text-rose-500">Overdue</span>
                        )}
                    </span>
                </div>
            ),
        },
        {
            key: 'status',
            label: 'STATUS',
            render: (_: any, l: InterestLoan) => (
                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black border uppercase ${statusStyle[l.status] ?? statusStyle.pending}`}>
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
                        className="flex items-center gap-2 px-3 py-1.5 bg-[#345E85] text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-opacity-90 transition-all shadow-md shadow-blue-100"
                    >
                        Audit <ArrowUpRight size={12} />
                    </button>
                </div>
            ),
        },
    ];

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* ── Stats Row ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Interest Collected"
                    value={summary ? fmtCurrency(summary.totalInterestCollected > 0 ? summary.totalInterestCollected : null) : 'N/A'}
                    subtitle={summary ? `Across ${summary.totalLoans} loan${summary.totalLoans !== 1 ? 's' : ''}` : 'Loading...'}
                    icon={<DollarSign size={24} />}
                    color="success"
                />
                <StatCard
                    title="Outstanding Interest"
                    value={summary?.totalOutstandingInterest != null
                        ? fmtCurrency(summary.totalOutstandingInterest > 0 ? summary.totalOutstandingInterest : null)
                        : 'N/A'}
                    subtitle={summary?.totalOutstandingInterest != null
                        ? summary.totalOutstandingInterest > 0 ? 'Receivable' : 'All settled'
                        : 'No contracted interest on record'}
                    icon={<Clock size={24} />}
                    color="warning"
                />
                <StatCard
                    title="Collection Efficiency"
                    value={summary?.collectionEfficiency != null
                        ? `${summary.collectionEfficiency.toFixed(1)}%`
                        : 'N/A'}
                    subtitle={summary?.collectionEfficiency != null
                        ? 'Interest paid vs contracted'
                        : 'No contracted interest data'}
                    icon={<Activity size={24} />}
                    color="secondary"
                />
                <StatCard
                    title="Overdue Loans"
                    value={summary != null ? summary.overdueCount.toString() : 'N/A'}
                    subtitle={summary != null
                        ? summary.overdueCount > 0 ? 'Past due date, not repaid' : 'None overdue'
                        : 'Loading...'}
                    icon={<AlertCircle size={24} />}
                    color={summary?.overdueCount ? 'error' : 'success'}
                />
            </div>

            {/* ── Principal deployed banner ── */}
            {summary && summary.totalPrincipalDeployed > 0 && (
                <div className="bg-white border border-slate-100 rounded-2xl px-6 py-4 flex items-center gap-4 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <TrendingUp size={18} className="text-[#345E85]" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Principal Deployed</p>
                        <p className="text-sm font-black text-slate-900">
                            {fmtCurrency(summary.totalPrincipalDeployed)}
                            <span className="ml-2 text-[10px] font-bold text-slate-400">
                                across {summary.totalLoans} loan{summary.totalLoans !== 1 ? 's' : ''}
                            </span>
                        </p>
                    </div>
                </div>
            )}

            {/* ── Main Layout ── */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">

                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-4">

                    {/* Status breakdown */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm space-y-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">
                            Status Breakdown
                        </p>
                        {Object.keys(statusStyle).map(s => {
                            const cnt = loans.filter(l => l.status === s).length;
                            if (cnt === 0) return null;
                            const exposure = loans
                                .filter(l => l.status === s)
                                .reduce((sum, l) => sum + (l.approvedAmount ?? l.requestedAmount ?? 0), 0);
                            return (
                                <div key={s} className="flex items-center justify-between py-1">
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase ${statusStyle[s]}`}>
                                        {s}
                                    </span>
                                    <div className="text-right">
                                        <p className="text-[11px] font-black text-slate-700">{cnt}</p>
                                        <p className="text-[9px] text-slate-400">{fmtCurrency(exposure)}</p>
                                    </div>
                                </div>
                            );
                        })}
                        {loans.length === 0 && (
                            <p className="text-[10px] text-slate-400 italic">No data</p>
                        )}
                    </div>

                    {/* Overdue alert */}
                    {summary && summary.overdueCount > 0 && (
                        <div className="bg-rose-50 rounded-2xl border border-rose-100 p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <XCircle size={16} className="text-rose-600" />
                                <p className="text-[10px] font-black text-rose-700 uppercase tracking-widest">
                                    {summary.overdueCount} Overdue
                                </p>
                            </div>
                            <div className="space-y-2">
                                {loans.filter(l => isOverdue(l.dueDate, l.status)).map(l => (
                                    <div key={l.loanId} className="text-[10px] text-rose-700">
                                        <p className="font-bold">{l.borrowerName ?? 'No name'}</p>
                                        <p className="text-rose-500">Due: {formatDate(l.dueDate)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Repaid summary */}
                    {loans.filter(l => l.status === 'repaid').length > 0 && (
                        <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <CheckCircle2 size={16} className="text-emerald-600" />
                                <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                                    {loans.filter(l => l.status === 'repaid').length} Repaid
                                </p>
                            </div>
                            <p className="text-xs font-bold text-emerald-700">
                                {fmtCurrency(
                                    loans.filter(l => l.status === 'repaid')
                                         .reduce((s, l) => s + l.totalInterestPaid, 0)
                                )} interest collected
                            </p>
                        </div>
                    )}

                    {/* Policy note */}
                    <div className="bg-[#345E85] rounded-2xl p-5 text-white shadow-xl shadow-blue-100 relative overflow-hidden">
                        <div className="relative z-10">
                            <Percent className="mb-3 opacity-50" size={24} />
                            <h4 className="text-[11px] font-black uppercase tracking-tighter leading-tight">
                                Interest Data Policy
                            </h4>
                            <p className="text-[9px] font-bold text-blue-100/70 mt-2 uppercase tracking-widest leading-relaxed">
                                Interest figures are sourced exclusively from loan repayment records.
                                "—" means no repayments have been recorded yet.
                            </p>
                        </div>
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12" />
                    </div>
                </div>

                {/* Main table */}
                <div className="lg:col-span-3">
                    <DataCard
                        title="INTEREST REVENUE TERMINAL"
                        subtitle="Per-loan interest breakdown from verified repayment records"
                    >
                        <div className="space-y-6">
                            <div className="flex items-center justify-between gap-4 py-2 mt-2">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="SEARCH LOANS..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black tracking-widest uppercase focus:ring-2 focus:ring-[#345E85] focus:outline-none transition-all"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Filter size={14} className="text-slate-400" />
                                    <select
                                        value={statusFilter}
                                        onChange={e => setStatusFilter(e.target.value)}
                                        className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black tracking-widest uppercase focus:outline-none"
                                    >
                                        <option value="all">ALL STATUS</option>
                                        <option value="pending">PENDING</option>
                                        <option value="approved">APPROVED</option>
                                        <option value="disbursed">DISBURSED</option>
                                        <option value="repaid">REPAID</option>
                                        <option value="defaulted">DEFAULTED</option>
                                    </select>
                                </div>
                            </div>

                            <EnhancedTable
                                columns={columns}
                                data={filtered}
                                loading={loading}
                                emptyMessage="No interest records found"
                            />
                        </div>
                    </DataCard>
                </div>
            </div>

            {/* Loan Detail Modal */}
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


