import React, { useState } from 'react';
import {
    Clock,
    DollarSign,
    CheckCircle,
    AlertTriangle,
    Eye,
    Calendar,
    User,
    Search,
    Filter,
} from 'lucide-react';
import DataCard from '../EnliteUI/Cards/DataCard';
import EnhancedTable from '../EnliteUI/Tables/EnhancedTable';
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
    const formatAmount = (amount: number | null): string =>
        amount === null ? '—' : fmtCurrency(amount);

    const [searchTerm, setSearchTerm]     = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [detailLoan, setDetailLoan]     = useState<any | null>(null);

    const filtered = repayments.filter(r => {
        const q = searchTerm.toLowerCase();
        const matchSearch =
            (r.borrowerName ?? '').toLowerCase().includes(q) ||
            (r.loanId ?? '').toLowerCase().includes(q) ||
            r.id.toLowerCase().includes(q);
        const matchStatus = statusFilter === 'all' || r.status === statusFilter;
        return matchSearch && matchStatus;
    });

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
                        {formatAmount(r.amount)}
                    </p>
                    <div className="flex gap-2 text-[10px] font-medium uppercase tracking-wider">
                        {r.principalPaid !== null && (
                            <span className="text-[#2c5173]">P: {formatAmount(r.principalPaid)}</span>
                        )}
                        {r.interestPaid !== null && r.interestPaid > 0 && (
                            <span className="text-emerald-600">I: {formatAmount(r.interestPaid)}</span>
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
                        {formatAmount(r.approvedAmount ?? r.requestedAmount)}
                    </p>
                    {r.approvedAmount !== null && r.requestedAmount !== null && r.approvedAmount !== r.requestedAmount && (
                        <p className="text-[10px] text-slate-500">
                            Req: {formatAmount(r.requestedAmount)}
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
            <DataCard
                title="Repayment Records"
                subtitle="Verified repayment transactions from loan repayment history"
                icon={<DollarSign className="w-5 h-5" />}
                headerColor="primary"
                actions={
                    <div className="flex items-center gap-2">
                        <div className="relative hidden md:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" size={14} />
                            <input
                                type="text"
                                placeholder="SEARCH REPAYMENTS..."
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
                                <option value="paid" className="text-slate-900">PAID</option>
                                <option value="completed" className="text-slate-900">COMPLETED</option>
                                <option value="pending" className="text-slate-900">PENDING</option>
                                <option value="overdue" className="text-slate-900">OVERDUE</option>
                                <option value="partial" className="text-slate-900">PARTIAL</option>
                                <option value="failed" className="text-slate-900">FAILED</option>
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
                            placeholder="Search repayments..."
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
                        emptyMessage="No repayment records found"
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

export default RepaymentsEnlite;
