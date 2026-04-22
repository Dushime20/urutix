import React, { useState } from 'react';
import {
    ArrowUpRight,
    ArrowDownLeft,
    Search,
    Filter,
    FileText,
    CreditCard,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Eye,
    DollarSign,
    TrendingUp,
    TrendingDown,
} from 'lucide-react';
import StatCard from '../EnliteUI/Cards/StatCard';
import DataCard from '../EnliteUI/Cards/DataCard';
import EnhancedTable from '../EnliteUI/Tables/EnhancedTable';
import LoanDetailModal from './LoanDetailModal';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TxEntry {
    id: string;
    source: 'disbursement' | 'repayment';
    date: string | null;
    amount: number | null;       // negative = outflow (disbursement), positive = inflow (repayment)
    status: string | null;
    borrowerName: string | null;
    loanId: string | null;
    reference: string | null;
    purpose: string | null;
    interestRate: number | null;
    interestPaid?: number | null;
    principalPaid?: number | null;
    notes: string | null;
    _rawData?: any;
}

interface HistoryEnliteProps {
    loading: boolean;
    entries: TxEntry[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const statusStyle: Record<string, string> = {
    completed:  'bg-emerald-50 text-emerald-700 border-emerald-100',
    disbursed:  'bg-emerald-50 text-emerald-700 border-emerald-100',
    paid:       'bg-emerald-50 text-emerald-700 border-emerald-100',
    pending:    'bg-amber-50 text-amber-700 border-amber-100',
    approved:   'bg-blue-50 text-blue-700 border-blue-100',
    failed:     'bg-rose-50 text-rose-700 border-rose-100',
    rejected:   'bg-rose-50 text-rose-700 border-rose-100',
    cancelled:  'bg-slate-50 text-slate-600 border-slate-100',
    on_hold:    'bg-orange-50 text-orange-700 border-orange-100',
};

const formatAmount = (amount: number | null): string => {
    if (amount === null) return '—';
    const abs = Math.abs(amount);
    if (abs >= 1_000_000) return `USD ${(abs / 1_000_000).toFixed(2)}M`;
    if (abs >= 1_000)    return `USD ${(abs / 1_000).toFixed(2)}K`;
    return `USD ${abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (iso: string | null): string => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
    });
};

const formatTime = (iso: string | null): string => {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit',
    });
};

// ─── Component ────────────────────────────────────────────────────────────────

const HistoryEnlite: React.FC<HistoryEnliteProps> = ({ loading, entries }) => {
    const [searchTerm, setSearchTerm]     = useState('');
    const [typeFilter, setTypeFilter]     = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [detailLoan, setDetailLoan]     = useState<any | null>(null);

    // ── Derived stats — only from real data ───────────────────────────────────

    const disbursements = entries.filter(e => e.source === 'disbursement');
    const repayments    = entries.filter(e => e.source === 'repayment');

    const totalOutflow = disbursements.reduce((s, e) => s + Math.abs(e.amount ?? 0), 0);
    const totalInflow  = repayments.reduce((s, e) => s + (e.amount ?? 0), 0);
    const totalInterestCollected = repayments.reduce(
        (s, e) => s + (e.interestPaid ?? 0), 0,
    );

    // ── Filtered data ─────────────────────────────────────────────────────────

    const filtered = entries.filter(e => {
        const q = searchTerm.toLowerCase();
        const matchSearch =
            (e.borrowerName ?? '').toLowerCase().includes(q) ||
            (e.loanId ?? '').toLowerCase().includes(q) ||
            e.id.toLowerCase().includes(q) ||
            (e.reference ?? '').toLowerCase().includes(q);
        const matchType   = typeFilter === 'all' || e.source === typeFilter;
        const matchStatus = statusFilter === 'all' || e.status === statusFilter;
        return matchSearch && matchType && matchStatus;
    });

    // ── Table columns ─────────────────────────────────────────────────────────

    const columns = [
        {
            key: 'date',
            label: 'DATE',
            render: (_: any, e: TxEntry) => (
                <div className="flex flex-col">
                    <span className="font-black text-slate-900 text-[11px]">
                        {formatDate(e.date)}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold">
                        {formatTime(e.date)}
                    </span>
                </div>
            ),
        },
        {
            key: 'type',
            label: 'TYPE',
            render: (_: any, e: TxEntry) => (
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${e.source === 'disbursement' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {e.source === 'disbursement'
                            ? <ArrowUpRight size={13} />
                            : <ArrowDownLeft size={13} />}
                    </div>
                    <div className="flex flex-col">
                        <span className="font-black text-slate-900 uppercase text-[10px] tracking-tight">
                            {e.source === 'disbursement' ? 'Disbursement' : 'Repayment'}
                        </span>
                        {e.purpose && (
                            <span className="text-[9px] text-slate-400 font-bold truncate max-w-[120px]">
                                {e.purpose}
                            </span>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: 'borrower',
            label: 'BORROWER',
            render: (_: any, e: TxEntry) => (
                <div className="flex flex-col min-w-0">
                    <span className="font-black text-slate-900 uppercase text-[11px] truncate">
                        {e.borrowerName ?? (
                            <span className="text-slate-400 italic normal-case font-medium">No name on record</span>
                        )}
                    </span>
                    {e.loanId && (
                        <span className="text-[9px] text-slate-400 font-mono">
                            Loan: {e.loanId.substring(0, 8)}…
                        </span>
                    )}
                </div>
            ),
        },
        {
            key: 'amount',
            label: 'AMOUNT',
            render: (_: any, e: TxEntry) => (
                <div className="flex flex-col text-right">
                    <span className={`font-black text-[12px] ${
                        e.amount === null ? 'text-slate-400' :
                        e.amount > 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                        {e.amount !== null
                            ? `${e.amount > 0 ? '+' : '−'}${formatAmount(e.amount)}`
                            : '—'}
                    </span>
                    {/* Show interest/principal breakdown for repayments */}
                    {e.source === 'repayment' && (e.interestPaid !== null || e.principalPaid !== null) && (
                        <div className="flex gap-2 justify-end text-[9px] font-bold uppercase">
                            {e.principalPaid !== null && e.principalPaid > 0 && (
                                <span className="text-[#345E85]">P: {formatAmount(e.principalPaid)}</span>
                            )}
                            {e.interestPaid !== null && e.interestPaid > 0 && (
                                <span className="text-emerald-600">I: {formatAmount(e.interestPaid)}</span>
                            )}
                        </div>
                    )}
                    {e.source === 'disbursement' && e.interestRate !== null && (
                        <span className="text-[9px] text-slate-400 font-bold">{e.interestRate}% APR</span>
                    )}
                </div>
            ),
        },
        {
            key: 'status',
            label: 'STATUS',
            render: (_: any, e: TxEntry) => {
                if (!e.status) return <span className="text-slate-400 text-[10px]">—</span>;
                const style = statusStyle[e.status] ?? 'bg-slate-50 text-slate-600 border-slate-100';
                const icon = (e.status === 'completed' || e.status === 'disbursed' || e.status === 'paid')
                    ? <CheckCircle2 size={10} />
                    : (e.status === 'failed' || e.status === 'rejected')
                    ? <XCircle size={10} />
                    : e.status === 'pending'
                    ? <Clock size={10} />
                    : <AlertCircle size={10} />;
                return (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black border uppercase ${style}`}>
                        {icon} {e.status.replace('_', ' ')}
                    </span>
                );
            },
        },
        {
            key: 'actions',
            label: '',
            render: (_: any, e: TxEntry) => (
                <div className="flex justify-end">
                    <button
                        onClick={() => e._rawData && setDetailLoan(e._rawData)}
                        disabled={!e._rawData}
                        className="p-1.5 text-slate-400 hover:text-[#345E85] hover:bg-blue-50 rounded-lg transition-all border border-transparent hover:border-blue-100 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="View details"
                    >
                        <Eye size={14} />
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
                    title="Total Events"
                    value={entries.length.toString()}
                    subtitle={`${disbursements.length} disbursements, ${repayments.length} repayments`}
                    icon={<FileText size={24} />}
                    color="primary"
                />
                <StatCard
                    title="Capital Outflow"
                    value={totalOutflow > 0 ? formatAmount(totalOutflow) : 'N/A'}
                    subtitle={`${disbursements.length} disbursement${disbursements.length !== 1 ? 's' : ''}`}
                    icon={<TrendingDown size={24} />}
                    color="error"
                />
                <StatCard
                    title="Capital Inflow"
                    value={totalInflow > 0 ? formatAmount(totalInflow) : 'N/A'}
                    subtitle={`${repayments.length} repayment${repayments.length !== 1 ? 's' : ''}`}
                    icon={<TrendingUp size={24} />}
                    color="success"
                />
                <StatCard
                    title="Interest Collected"
                    value={totalInterestCollected > 0 ? formatAmount(totalInterestCollected) : 'N/A'}
                    subtitle={totalInterestCollected > 0 ? 'From repayment records' : 'No interest recorded'}
                    icon={<DollarSign size={24} />}
                    color="secondary"
                />
            </div>

            {/* ── Main Layout ── */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">

                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-4">

                    {/* Type breakdown */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm space-y-3">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            Transaction Types
                        </p>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-rose-50">
                                    <ArrowUpRight size={12} className="text-rose-600" />
                                </div>
                                <span className="text-[10px] font-black text-slate-700 uppercase">Disbursements</span>
                            </div>
                            <span className="text-[11px] font-black text-slate-900">{disbursements.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-emerald-50">
                                    <ArrowDownLeft size={12} className="text-emerald-600" />
                                </div>
                                <span className="text-[10px] font-black text-slate-700 uppercase">Repayments</span>
                            </div>
                            <span className="text-[11px] font-black text-slate-900">{repayments.length}</span>
                        </div>
                    </div>

                    {/* Status breakdown */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm space-y-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                            Status Breakdown
                        </p>
                        {Object.keys(statusStyle).map(s => {
                            const cnt = entries.filter(e => e.status === s).length;
                            if (cnt === 0) return null;
                            return (
                                <div key={s} className="flex items-center justify-between py-0.5">
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase ${statusStyle[s]}`}>
                                        {s.replace('_', ' ')}
                                    </span>
                                    <span className="text-[11px] font-black text-slate-700">{cnt}</span>
                                </div>
                            );
                        })}
                        {entries.length === 0 && (
                            <p className="text-[10px] text-slate-400 italic">No data</p>
                        )}
                    </div>

                    {/* Policy note */}
                    <div className="bg-[#345E85] rounded-2xl p-5 text-white shadow-xl shadow-blue-100 relative overflow-hidden">
                        <div className="relative z-10">
                            <CreditCard className="mb-3 opacity-50" size={24} />
                            <h4 className="text-[11px] font-black uppercase tracking-tighter leading-tight">
                                Data Policy
                            </h4>
                            <p className="text-[9px] font-bold text-blue-100/70 mt-2 uppercase tracking-widest leading-relaxed">
                                All entries are sourced from verified disbursement and repayment records.
                                "—" means the field was not recorded.
                            </p>
                        </div>
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12" />
                    </div>
                </div>

                {/* Main table */}
                <div className="lg:col-span-3">
                    <DataCard
                        title="TRANSACTION LEDGER"
                        subtitle="Verified disbursements and repayments in chronological order"
                    >
                        <div className="space-y-6">
                            {/* Filters */}
                            <div className="flex flex-wrap items-center gap-3 py-2 mt-2">
                                <div className="relative flex-1 min-w-[200px] max-w-md">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="SEARCH BY BORROWER, LOAN ID..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black tracking-widest uppercase focus:ring-2 focus:ring-[#345E85] focus:outline-none transition-all"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Filter size={14} className="text-slate-400" />
                                    <select
                                        value={typeFilter}
                                        onChange={e => setTypeFilter(e.target.value)}
                                        className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black tracking-widest uppercase focus:outline-none"
                                    >
                                        <option value="all">ALL TYPES</option>
                                        <option value="disbursement">DISBURSEMENTS</option>
                                        <option value="repayment">REPAYMENTS</option>
                                    </select>
                                    <select
                                        value={statusFilter}
                                        onChange={e => setStatusFilter(e.target.value)}
                                        className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black tracking-widest uppercase focus:outline-none"
                                    >
                                        <option value="all">ALL STATUS</option>
                                        <option value="completed">COMPLETED</option>
                                        <option value="disbursed">DISBURSED</option>
                                        <option value="pending">PENDING</option>
                                        <option value="failed">FAILED</option>
                                        <option value="rejected">REJECTED</option>
                                    </select>
                                </div>
                            </div>

                            <EnhancedTable
                                columns={columns}
                                data={filtered}
                                loading={loading}
                                striped
                                hoverable
                                emptyMessage="No transactions match the current filters"
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

export default HistoryEnlite;
