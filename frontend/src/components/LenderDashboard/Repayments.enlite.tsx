import React, { useState } from 'react';
import {
    Clock,
    DollarSign,
    CheckCircle,
    AlertTriangle,
    Eye,
    Calendar,
    User,
} from 'lucide-react';
import { StandardDataTable } from '../EnliteUI/Tables';
import LoanDetailModal from './LoanDetailModal';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';

export interface RepaymentEntry {
    id: string;
    loanId: string | null;
    borrowerName: string | null;
    borrowerEmail: string | null;
    amount: number | null;
    interestPaid: number | null;
    principalPaid: number | null;
    repaymentDate: string | null;
    requestedAmount: number | null;
    approvedAmount: number | null;
    status: string | null;
    currency?: string | null;
    _rawData?: any;
}

interface RepaymentsEnliteProps {
    loading: boolean;
    repayments: RepaymentEntry[];
}

const statusStyle: Record<string, string> = {
    paid:      'bg-emerald-50 text-emerald-700 border-emerald-100',
    pending:   'bg-amber-50 text-amber-700 border-amber-100',
    overdue:   'bg-rose-50 text-rose-700 border-rose-100',
    partial:   'bg-blue-50 text-blue-700 border-blue-100',
    failed:    'bg-slate-50 text-slate-600 border-slate-100',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
};

const formatDate = (iso: string | null): string => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
    });
};

const RepaymentsEnlite: React.FC<RepaymentsEnliteProps> = ({
    loading,
    repayments,
}) => {
    const { format: fmtCurrency } = useCurrencyFormat();
    const formatAmount = (amount: number | null, currency?: string | null): string =>
        amount === null ? '—' : fmtCurrency(amount, currency || 'RWF');

    const [detailLoan, setDetailLoan] = useState<any | null>(null);

    const columns = [
        {
            key: 'id',
            label: 'Repayment',
            render: (id: string, r: RepaymentEntry) => (
                <div className="min-w-0">
                    <p className="font-semibold text-slate-900 text-sm font-mono">
                        {id.substring(0, 8)}…
                    </p>
                    {r.loanId && (
                        <p className="text-[10px] text-slate-500 font-medium font-mono">
                            Loan: {r.loanId.substring(0, 8)}…
                        </p>
                    )}
                </div>
            ),
        },
        {
            key: 'borrower',
            label: 'Borrower',
            render: (_: any, r: RepaymentEntry) => (
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shadow-sm flex-shrink-0">
                        <User size={14} className="text-[#2c5173]" />
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-slate-900 text-sm truncate">
                            {r.borrowerName ?? (
                                <span className="text-slate-400 italic font-medium">No name on record</span>
                            )}
                        </p>
                        {r.borrowerEmail && (
                            <p className="text-[10px] text-slate-500 truncate">{r.borrowerEmail}</p>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: 'amount',
            label: 'Amount Paid',
            render: (_: any, r: RepaymentEntry) => (
                <div className="min-w-0">
                    <p className="font-semibold text-slate-900 text-sm">
                        {formatAmount(r.amount, r.currency)}
                    </p>
                    <div className="flex gap-2 text-[10px] font-medium uppercase tracking-wider">
                        {r.principalPaid !== null && (
                            <span className="text-[#2c5173]">P: {formatAmount(r.principalPaid, r.currency)}</span>
                        )}
                        {r.interestPaid !== null && r.interestPaid > 0 && (
                            <span className="text-emerald-600">I: {formatAmount(r.interestPaid, r.currency)}</span>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: 'loan_context',
            label: 'Loan Amount',
            render: (_: any, r: RepaymentEntry) => (
                <div className="min-w-0">
                    <p className="font-semibold text-slate-900 text-sm">
                        {formatAmount(r.approvedAmount ?? r.requestedAmount, r.currency)}
                    </p>
                    {r.approvedAmount !== null && r.requestedAmount !== null && r.approvedAmount !== r.requestedAmount && (
                        <p className="text-[10px] text-slate-500">
                            Req: {formatAmount(r.requestedAmount, r.currency)}
                        </p>
                    )}
                </div>
            ),
        },
        {
            key: 'repaymentDate',
            label: 'Repayment Date',
            render: (_: any, r: RepaymentEntry) => (
                <div className="flex items-center gap-1.5">
                    <Calendar size={11} className="text-slate-400 flex-shrink-0" />
                    <span className="text-sm font-medium text-slate-600 whitespace-nowrap">
                        {formatDate(r.repaymentDate)}
                    </span>
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (_: any, r: RepaymentEntry) => {
                if (!r.status) return <span className="text-slate-400 text-sm">—</span>;
                const style = statusStyle[r.status] ?? 'bg-slate-50 text-slate-600 border-slate-100';
                const icon = r.status === 'paid' || r.status === 'completed'
                    ? <CheckCircle size={10} />
                    : r.status === 'overdue'
                    ? <AlertTriangle size={10} />
                    : <Clock size={10} />;
                return (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-bold border uppercase tracking-wider ${style}`}>
                        {icon} {r.status}
                    </span>
                );
            },
        },
        {
            key: 'actions',
            label: '',
            render: (_: any, r: RepaymentEntry) => (
                <div className="flex justify-end">
                    <button
                        onClick={() => setDetailLoan(r._rawData?.loan_request ?? r._rawData)}
                        disabled={!r._rawData}
                        className="p-1.5 text-slate-400 hover:text-[#2c5173] hover:bg-blue-50 rounded-lg transition-all border border-transparent hover:border-blue-100 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="View loan details"
                    >
                        <Eye size={15} />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-12">
            <StandardDataTable
                title="Repayment Records"
                subtitle="Verified repayment transactions from loan repayment history"
                icon={<DollarSign className="w-5 h-5" />}
                headerColor="primary"
                columns={columns}
                data={repayments}
                loading={loading}
                getRowId={(row) => row.id}
                searchable
                searchPlaceholder="Search repayments…"
                searchKeys={['borrowerName', 'borrowerEmail', 'loanId', 'id', 'status']}
                filters={[
                    {
                        key: 'status',
                        label: 'Status',
                        options: [
                            { value: 'paid', label: 'Paid' },
                            { value: 'completed', label: 'Completed' },
                            { value: 'pending', label: 'Pending' },
                            { value: 'overdue', label: 'Overdue' },
                            { value: 'partial', label: 'Partial' },
                            { value: 'failed', label: 'Failed' },
                        ],
                    },
                ]}
                pagination
                pageSize={10}
                columnVisibility
                stickyHeader
                striped
                hoverable
                emptyMessage="No repayment records found"
                ariaLabel="Repayment Records"
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

export default RepaymentsEnlite;
