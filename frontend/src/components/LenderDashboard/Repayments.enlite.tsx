import React, { useState } from 'react';
import {
    Clock,
    DollarSign,
    CheckCircle,
    AlertTriangle,
    Eye,
    FileText,
    Calendar,
    User,
    TrendingUp,
    Search,
    Filter,
    AlertCircle,
} from 'lucide-react';
import StatCard from '../EnliteUI/Cards/StatCard';
import DataCard from '../EnliteUI/Cards/DataCard';
import EnhancedTable from '../EnliteUI/Tables/EnhancedTable';
import LoanDetailModal from './LoanDetailModal';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

const RepaymentsEnlite: React.FC<RepaymentsEnliteProps> = ({
    loading,
    repayments,
}) => {
    const { format } = useCurrencyFormat();
    const formatAmount = (amount: number | null): string =>
        amount === null ? '—' : format(amount, 'RWF');

    const [searchTerm, setSearchTerm]     = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [detailLoan, setDetailLoan]     = useState<any | null>(null);

    // ── Derived stats — only from real data ───────────────────────────────────

    const totalInterestCollected = repayments.reduce(
        (s, r) => s + (r.interestPaid ?? 0), 0,
    );
    const totalPrincipalRepaid = repayments.reduce(
        (s, r) => s + (r.principalPaid ?? 0), 0,
    );
    const totalAmountRepaid = repayments.reduce(
        (s, r) => s + (r.amount ?? 0), 0,
    );

    const paidCount    = repayments.filter(r => r.status === 'paid' || r.status === 'completed').length;
    const overdueCount = repayments.filter(r => r.status === 'overdue').length;
    const pendingCount = repayments.filter(r => r.status === 'pending').length;

    // ── Filtered data ─────────────────────────────────────────────────────────

    const filtered = repayments.filter(r => {
        const q = searchTerm.toLowerCase();
        const matchSearch =
            (r.borrowerName ?? '').toLowerCase().includes(q) ||
            (r.loanId ?? '').toLowerCase().includes(q) ||
            r.id.toLowerCase().includes(q);
        const matchStatus = statusFilter === 'all' || r.status === statusFilter;
        return matchSearch && matchStatus;
    });

    // ── Table columns ─────────────────────────────────────────────────────────

    const columns = [
        {
            key: 'id',
            label: 'REPAYMENT ID',
            render: (id: string, r: RepaymentEntry) => (
                <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] font-black text-slate-900 font-mono">
                        {id.substring(0, 8)}…
                    </span>
                    {r.loanId && (
                        <span className="text-[9px] font-bold text-slate-400 font-mono">
                            Loan: {r.loanId.substring(0, 8)}…
                        </span>
                    )}
                </div>
            ),
        },
        {
            key: 'borrower',
            label: 'BORROWER',
            render: (_: any, r: RepaymentEntry) => (
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 flex-shrink-0">
                        <User size={16} className="text-[#345E85]" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-black text-slate-900 uppercase text-[11px] truncate">
                            {r.borrowerName ?? (
                                <span className="text-slate-400 italic normal-case font-medium">No name on record</span>
                            )}
                        </span>
                        {r.borrowerEmail && (
                            <span className="text-[9px] text-slate-400 truncate">{r.borrowerEmail}</span>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: 'amount',
            label: 'AMOUNT PAID',
            render: (_: any, r: RepaymentEntry) => (
                <div className="flex flex-col gap-0.5">
                    <span className="font-black text-slate-900 text-[12px]">
                        {formatAmount(r.amount)}
                    </span>
                    <div className="flex gap-2">
                        {r.principalPaid !== null && (
                            <span className="text-[9px] font-bold text-[#345E85] uppercase">
                                P: {formatAmount(r.principalPaid)}
                            </span>
                        )}
                        {r.interestPaid !== null && r.interestPaid > 0 && (
                            <span className="text-[9px] font-bold text-emerald-600 uppercase">
                                I: {formatAmount(r.interestPaid)}
                            </span>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: 'loan_context',
            label: 'LOAN AMOUNT',
            render: (_: any, r: RepaymentEntry) => (
                <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] font-semibold text-slate-700">
                        {formatAmount(r.approvedAmount ?? r.requestedAmount)}
                    </span>
                    {r.approvedAmount !== null && r.requestedAmount !== null && r.approvedAmount !== r.requestedAmount && (
                        <span className="text-[9px] text-slate-400">
                            Req: {formatAmount(r.requestedAmount)}
                        </span>
                    )}
                </div>
            ),
        },
        {
            key: 'repaymentDate',
            label: 'REPAYMENT DATE',
            render: (_: any, r: RepaymentEntry) => (
                <div className="flex items-center gap-1.5">
                    <Calendar size={11} className="text-slate-400 flex-shrink-0" />
                    <span className="text-[10px] font-semibold text-slate-600 whitespace-nowrap">
                        {formatDate(r.repaymentDate)}
                    </span>
                </div>
            ),
        },
        {
            key: 'status',
            label: 'STATUS',
            render: (_: any, r: RepaymentEntry) => {
                if (!r.status) return <span className="text-slate-400 text-[10px]">—</span>;
                const style = statusStyle[r.status] ?? 'bg-slate-50 text-slate-600 border-slate-100';
                const icon = r.status === 'paid' || r.status === 'completed'
                    ? <CheckCircle size={10} />
                    : r.status === 'overdue'
                    ? <AlertTriangle size={10} />
                    : <Clock size={10} />;
                return (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black border uppercase ${style}`}>
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
                        className="p-1.5 text-slate-400 hover:text-[#345E85] hover:bg-blue-50 rounded-lg transition-all border border-transparent hover:border-blue-100 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="View loan details"
                    >
                        <Eye size={15} />
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
                    title="Total Repaid"
                    value={totalAmountRepaid > 0 ? formatAmount(totalAmountRepaid) : 'N/A'}
                    subtitle={`${repayments.length} repayment record${repayments.length !== 1 ? 's' : ''}`}
                    icon={<DollarSign size={24} />}
                    color="success"
                />
                <StatCard
                    title="Interest Collected"
                    value={totalInterestCollected > 0 ? formatAmount(totalInterestCollected) : 'N/A'}
                    subtitle={totalInterestCollected > 0 ? 'From repayment records' : 'No interest recorded yet'}
                    icon={<TrendingUp size={24} />}
                    color="primary"
                />
                <StatCard
                    title="Overdue"
                    value={overdueCount.toString()}
                    subtitle={overdueCount > 0 ? 'Require attention' : 'None overdue'}
                    icon={<AlertTriangle size={24} />}
                    color={overdueCount > 0 ? 'error' : 'success'}
                />
                <StatCard
                    title="Pending"
                    value={pendingCount.toString()}
                    subtitle={pendingCount > 0 ? 'Awaiting payment' : 'None pending'}
                    icon={<Clock size={24} />}
                    color="warning"
                />
            </div>

            {/* ── Summary banner ── */}
            {totalPrincipalRepaid > 0 && (
                <div className="bg-white border border-slate-100 rounded-2xl px-6 py-4 flex items-center gap-4 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <FileText size={18} className="text-[#345E85]" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Principal Repaid</p>
                        <p className="text-sm font-black text-slate-900">
                            {formatAmount(totalPrincipalRepaid)}
                            <span className="ml-2 text-[10px] font-bold text-slate-400">
                                across {paidCount} completed repayment{paidCount !== 1 ? 's' : ''}
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
                            const cnt = repayments.filter(r => r.status === s).length;
                            if (cnt === 0) return null;
                            const total = repayments
                                .filter(r => r.status === s)
                                .reduce((sum, r) => sum + (r.amount ?? 0), 0);
                            return (
                                <div key={s} className="flex items-center justify-between py-1">
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase ${statusStyle[s]}`}>
                                        {s}
                                    </span>
                                    <div className="text-right">
                                        <p className="text-[11px] font-black text-slate-700">{cnt}</p>
                                        <p className="text-[9px] text-slate-400">{formatAmount(total > 0 ? total : null)}</p>
                                    </div>
                                </div>
                            );
                        })}
                        {repayments.length === 0 && (
                            <p className="text-[10px] text-slate-400 italic">No data</p>
                        )}
                    </div>

                    {/* Overdue alert */}
                    {overdueCount > 0 && (
                        <div className="bg-rose-50 rounded-2xl border border-rose-100 p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <AlertCircle size={16} className="text-rose-600" />
                                <p className="text-[10px] font-black text-rose-700 uppercase tracking-widest">
                                    {overdueCount} Overdue
                                </p>
                            </div>
                            <div className="space-y-2">
                                {repayments.filter(r => r.status === 'overdue').map(r => (
                                    <div key={r.id} className="text-[10px] text-rose-700 bg-white rounded-lg p-2 border border-rose-100">
                                        <p className="font-bold">{r.borrowerName ?? 'No name'}</p>
                                        <p className="text-rose-500">{formatAmount(r.amount)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Policy note */}
                    <div className="bg-[#345E85] rounded-2xl p-5 text-white shadow-xl shadow-blue-100 relative overflow-hidden">
                        <div className="relative z-10">
                            <FileText className="mb-3 opacity-50" size={24} />
                            <h4 className="text-[11px] font-black uppercase tracking-tighter leading-tight">
                                Data Policy
                            </h4>
                            <p className="text-[9px] font-bold text-blue-100/70 mt-2 uppercase tracking-widest leading-relaxed">
                                All figures are sourced exclusively from verified repayment records.
                                "—" means the field was not recorded.
                            </p>
                        </div>
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12" />
                    </div>
                </div>

                {/* Main table */}
                <div className="lg:col-span-3">
                    <DataCard
                        title="REPAYMENT RECORDS"
                        subtitle="Verified repayment transactions from loan repayment history"
                    >
                        <div className="space-y-6">
                            <div className="flex items-center justify-between gap-4 py-2 mt-2">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="SEARCH REPAYMENTS..."
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
                                        <option value="paid">PAID</option>
                                        <option value="completed">COMPLETED</option>
                                        <option value="pending">PENDING</option>
                                        <option value="overdue">OVERDUE</option>
                                        <option value="partial">PARTIAL</option>
                                        <option value="failed">FAILED</option>
                                    </select>
                                </div>
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

export default RepaymentsEnlite;
