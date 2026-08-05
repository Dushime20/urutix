import React, { useState } from 'react';
import {
    TrendingUp,
    ArrowUpRight,
    Calendar,
    User,
} from 'lucide-react';
import { StandardDataTable } from '../EnliteUI/Tables';
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
    /** @deprecated KPIs live on Overview only — kept optional for call-site compat */
    summary?: {
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
}) => {
    const { format: fmtCurrency } = useCurrencyFormat();
    const formatAmount = (amount: number | null): string =>
        amount === null ? '—' : fmtCurrency(amount);

    const [detailLoan, setDetailLoan] = useState<any | null>(null);

    const columns = [
        {
            key: 'loan',
            label: 'Borrower',
            render: (_: any, l: InterestLoan) => (
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold text-xs ring-2 ring-white shadow-sm border border-slate-200 dark:border-slate-700 flex-shrink-0">
                        <User size={14} className="text-[#2c5173]" />
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">
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
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">
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
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">
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
            <StandardDataTable
                title="Interest Revenue"
                subtitle="Per-loan interest breakdown from verified repayment records"
                icon={<TrendingUp className="w-5 h-5" />}
                headerColor="primary"
                columns={columns}
                data={loans}
                loading={loading}
                getRowId={(row) => row.loanId}
                searchable
                searchPlaceholder="Search loans…"
                searchKeys={['borrowerName', 'businessName', 'loanId', 'status', 'purpose']}
                filters={[
                    {
                        key: 'status',
                        label: 'Status',
                        options: [
                            { value: 'pending', label: 'Pending' },
                            { value: 'approved', label: 'Approved' },
                            { value: 'disbursed', label: 'Disbursed' },
                            { value: 'repaid', label: 'Repaid' },
                            { value: 'defaulted', label: 'Defaulted' },
                        ],
                    },
                ]}
                pagination
                pageSize={10}
                columnVisibility
                stickyHeader
                striped
                hoverable
                emptyMessage="No interest records found"
                ariaLabel="Interest Revenue"
            />

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
