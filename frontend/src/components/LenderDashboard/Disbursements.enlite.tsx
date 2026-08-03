import React, { useState } from 'react';
import {
    DollarSign,
    CheckCircle,
    XCircle,
    Calendar,
    User,
    ArrowUpRight,
    AlertCircle,
} from 'lucide-react';
import { StandardDataTable } from '../EnliteUI/Tables';
import LoanDetailModal from './LoanDetailModal';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
import { useTranslation } from '../../hooks/useTranslation';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DisbursementEntry {
    id: string;
    loanId: string | null;
    borrowerName: string | null;
    amount: number | null;
    currency?: string | null;
    status: string | null;
    requestedDate: string | null;
    approvedDate: string | null;
    disbursedDate: string | null;
    purpose: string | null;
    interestRate: number | null;
    termMonths: number | null;
    notes: string | null;
    priority: string | null;
    _rawData?: any;
}

interface DisbursementsEnliteProps {
    loading: boolean;
    disbursements: DisbursementEntry[];
    statusFilter: string;
    searchTerm: string;
    onStatusFilterChange: (v: string) => void;
    onSearchChange: (v: string) => void;
    onApprove: (id: string) => void;
    onDisburse: (id: string) => void;
    onReject: (id: string, reason: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const statusStyle: Record<string, string> = {
    pending:   'bg-amber-50 text-amber-700 border-amber-100',
    approved:  'bg-emerald-50 text-emerald-700 border-emerald-100',
    disbursed: 'bg-blue-50 text-blue-700 border-blue-100',
    rejected:  'bg-rose-50 text-rose-700 border-rose-100',
    on_hold:   'bg-orange-50 text-orange-700 border-orange-100',
};

const formatDate = (iso: string | null): string => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
    });
};

// ─── Reject Reason Modal ──────────────────────────────────────────────────────

const RejectModal: React.FC<{
    disbursementId: string;
    borrowerName: string | null;
    onConfirm: (id: string, reason: string) => void;
    onCancel: () => void;
}> = ({ disbursementId, borrowerName, onConfirm, onCancel }) => {
    const [reason, setReason] = useState('');

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
                <div className="bg-rose-50 px-8 py-6 border-b border-rose-100">
                    <h3 className="text-lg font-black text-rose-900 uppercase tracking-tight">Reject Disbursement</h3>
                    <p className="text-xs text-rose-600 mt-1">
                        {borrowerName ?? 'Unknown borrower'} — {disbursementId.substring(0, 8)}…
                    </p>
                </div>
                <div className="p-8 space-y-4">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                            Rejection Reason <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            placeholder="State the reason for rejection..."
                            rows={3}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 focus:ring-4 focus:ring-rose-50 focus:border-rose-400 outline-none transition-all resize-none"
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onCancel}
                            className="flex-1 py-3 border border-slate-200 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => reason.trim() && onConfirm(disbursementId, reason.trim())}
                            disabled={!reason.trim()}
                            className="flex-1 py-3 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Confirm Rejection
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Disburse Confirm Modal ───────────────────────────────────────────────────

const DisburseModal: React.FC<{
    entry: DisbursementEntry;
    onConfirm: (id: string) => void;
    onCancel: () => void;
}> = ({ entry, onConfirm, onCancel }) => {
    const { format: fmtDisburse } = useCurrencyFormat();
    const fmtAmt = (amount: number | null) =>
        amount === null ? '—' : fmtDisburse(amount, entry.currency || 'RWF');
    return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="bg-[#345E85] px-8 py-6">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200">Confirm Disbursement</p>
                <h3 className="text-xl font-black text-white tracking-tight mt-1">Release Funds</h3>
            </div>
            <div className="p-8 space-y-6">
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-3">
                    <div className="flex justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Borrower</span>
                        <span className="text-sm font-black text-slate-900">
                            {entry.borrowerName ?? <span className="text-slate-400 italic font-medium">No name on record</span>}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</span>
                        <span className="text-sm font-black text-[#345E85]">{fmtAmt(entry.amount)}</span>
                    </div>
                    {entry.purpose && (
                        <div className="flex justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Purpose</span>
                            <span className="text-sm font-semibold text-slate-700 capitalize">{entry.purpose}</span>
                        </div>
                    )}
                    {entry.interestRate !== null && (
                        <div className="flex justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Interest Rate</span>
                            <span className="text-sm font-black text-slate-900">{entry.interestRate}% APR</span>
                        </div>
                    )}
                    {entry.termMonths !== null && (
                        <div className="flex justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Term</span>
                            <span className="text-sm font-black text-slate-900">{entry.termMonths} months</span>
                        </div>
                    )}
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3">
                    <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs font-semibold text-amber-800">
                        This action will mark the loan as disbursed. Ensure funds have been transferred before confirming.
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3 border border-slate-200 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onConfirm(entry.id)}
                        className="flex-1 py-3 bg-[#345E85] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-blue-100"
                    >
                        Confirm Disbursement
                    </button>
                </div>
            </div>
        </div>
    </div>
    );
};

// ─── Component ────────────────────────────────────────────────────────────────

const DisbursementsEnlite: React.FC<DisbursementsEnliteProps> = ({
    loading,
    disbursements,
    statusFilter,
    searchTerm,
    onStatusFilterChange,
    onSearchChange,
    onApprove,
    onDisburse,
    onReject,
}) => {
    const { format } = useCurrencyFormat();
    const formatAmount = (amount: number | null, currency?: string | null): string =>
        amount === null ? '—' : format(amount, currency || 'RWF');
    const { tSync: t } = useTranslation();

    const [detailLoan, setDetailLoan]         = useState<any | null>(null);
    const [rejectTarget, setRejectTarget]     = useState<DisbursementEntry | null>(null);
    const [disburseTarget, setDisburseTarget] = useState<DisbursementEntry | null>(null);

    const approvedCount = disbursements.filter(d => d.status === 'approved').length;

    const columns = [
        {
            key: 'id',
            label: t('DISBURSEMENT ID'),
            render: (id: string, d: DisbursementEntry) => (
                <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] font-black text-slate-900 font-mono">
                        {id.substring(0, 8)}…
                    </span>
                    {d.loanId && (
                        <span className="text-[9px] font-bold text-slate-400 font-mono">
                            Loan: {d.loanId.substring(0, 8)}…
                        </span>
                    )}
                </div>
            ),
        },
        {
            key: 'borrower',
            label: 'BORROWER',
            render: (_: any, d: DisbursementEntry) => (
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 flex-shrink-0">
                        <User size={16} className="text-[#345E85]" />
                    </div>
                    <span className="font-black text-slate-900 uppercase text-[11px] truncate max-w-[160px]">
                        {d.borrowerName ?? (
                            <span className="text-slate-400 italic normal-case font-medium">No name on record</span>
                        )}
                    </span>
                </div>
            ),
        },
        {
            key: 'amount',
            label: 'AMOUNT',
            render: (_: any, d: DisbursementEntry) => (
                <div className="flex flex-col gap-0.5">
                    <span className="font-black text-slate-900 text-[12px]">
                        {formatAmount(d.amount, d.currency)}
                    </span>
                    {d.purpose && (
                        <span className="text-[9px] font-bold text-slate-400 uppercase truncate max-w-[140px]">
                            {d.purpose}
                        </span>
                    )}
                </div>
            ),
        },
        {
            key: 'terms',
            label: 'TERMS',
            render: (_: any, d: DisbursementEntry) => (
                <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] font-semibold text-slate-700">
                        {d.interestRate !== null ? `${d.interestRate}% APR` : '—'}
                    </span>
                    <span className="text-[9px] text-slate-400">
                        {d.termMonths !== null ? `${d.termMonths} months` : '—'}
                    </span>
                </div>
            ),
        },
        {
            key: 'dates',
            label: 'DATES',
            render: (_: any, d: DisbursementEntry) => (
                <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1">
                        <Calendar size={10} className="text-slate-400" />
                        <span className="text-[10px] font-semibold text-slate-600">
                            {formatDate(d.requestedDate)}
                        </span>
                    </div>
                    {d.disbursedDate && (
                        <span className="text-[9px] text-emerald-600 font-bold">
                            Disbursed: {formatDate(d.disbursedDate)}
                        </span>
                    )}
                </div>
            ),
        },
        {
            key: 'status',
            label: 'STATUS',
            render: (_: any, d: DisbursementEntry) => {
                if (!d.status) return <span className="text-slate-400 text-[10px]">—</span>;
                const style = statusStyle[d.status] ?? 'bg-slate-50 text-slate-600 border-slate-100';
                return (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black border uppercase ${style}`}>
                        {d.status.replace('_', ' ')}
                    </span>
                );
            },
        },
        {
            key: 'actions',
            label: 'ACTIONS',
            render: (_: any, d: DisbursementEntry) => (
                <div className="flex items-center justify-end gap-1.5">
                    <button
                        onClick={() => setDetailLoan(d._rawData)}
                        className="p-1.5 text-slate-400 hover:text-[#345E85] hover:bg-blue-50 rounded-lg transition-all border border-transparent hover:border-blue-100"
                        title="View details"
                    >
                        <ArrowUpRight size={14} />
                    </button>

                    {d.status === 'pending' && (
                        <button
                            onClick={() => onApprove(d.id)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all border border-transparent hover:border-emerald-100"
                            title="Approve disbursement"
                        >
                            <CheckCircle size={14} />
                        </button>
                    )}

                    {d.status === 'approved' && (
                        <button
                            onClick={() => setDisburseTarget(d)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#345E85] text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-opacity-90 transition-all shadow-md shadow-blue-100"
                            title="Release funds"
                        >
                            <DollarSign size={12} /> Release Funds
                        </button>
                    )}

                    {(d.status === 'pending' || d.status === 'approved') && (
                        <button
                            onClick={() => setRejectTarget(d)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-all border border-transparent hover:border-rose-100"
                            title="Reject disbursement"
                        >
                            <XCircle size={14} />
                        </button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {approvedCount > 0 && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-6 py-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <DollarSign size={18} className="text-emerald-700" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                            {approvedCount} loan{approvedCount !== 1 ? 's' : ''} approved and ready for disbursement
                        </p>
                        <p className="text-xs text-emerald-600 mt-0.5">
                            Click "Release Funds" on each approved loan to complete the disbursement.
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">

                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm space-y-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">
                            Status Breakdown
                        </p>
                        {Object.keys(statusStyle).map(s => {
                            const cnt = disbursements.filter(d => d.status === s).length;
                            if (cnt === 0) return null;
                            const total = disbursements
                                .filter(d => d.status === s)
                                .reduce((sum, d) => sum + (d.amount ?? 0), 0);
                            return (
                                <div key={s} className="flex items-center justify-between py-1">
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase ${statusStyle[s]}`}>
                                        {s.replace('_', ' ')}
                                    </span>
                                    <div className="text-right">
                                        <p className="text-[11px] font-black text-slate-700">{cnt}</p>
                                        <p className="text-[9px] text-slate-400">{formatAmount(total > 0 ? total : null, disbursements.find(d => d.status === s)?.currency)}</p>
                                    </div>
                                </div>
                            );
                        })}
                        {disbursements.length === 0 && (
                            <p className="text-[10px] text-slate-400 italic">No data</p>
                        )}
                    </div>

                    <div className="bg-[#345E85] rounded-2xl p-5 text-white shadow-xl shadow-blue-100 relative overflow-hidden">
                        <div className="relative z-10">
                            <AlertCircle className="mb-3 opacity-50" size={24} />
                            <h4 className="text-[11px] font-black uppercase tracking-tighter leading-tight">
                                Disbursement Workflow
                            </h4>
                            <div className="mt-3 space-y-2 text-[9px] font-bold text-blue-100/80 uppercase tracking-widest">
                                <p>1. Review pending request</p>
                                <p>2. Approve → status: approved</p>
                                <p>3. Transfer funds externally</p>
                                <p>4. Click "Release Funds" to confirm</p>
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12" />
                    </div>
                </div>

                <div className="lg:col-span-3">
                    <StandardDataTable
                        title={t("DISBURSEMENT PIPELINE")}
                        subtitle={t("Authorize and track loan funding operations")}
                        icon={<DollarSign className="w-5 h-5" />}
                        headerColor="primary"
                        columns={columns}
                        data={disbursements}
                        loading={loading}
                        getRowId={(row) => row.id}
                        searchable
                        searchPlaceholder="Search disbursements…"
                        searchKeys={['borrowerName', 'loanId', 'id', 'purpose', 'status']}
                        searchValue={searchTerm}
                        onSearchChange={onSearchChange}
                        filters={[
                            {
                                key: 'status',
                                label: 'Status',
                                options: [
                                    { value: 'pending', label: 'Pending' },
                                    { value: 'approved', label: 'Approved' },
                                    { value: 'disbursed', label: 'Disbursed' },
                                    { value: 'rejected', label: 'Rejected' },
                                    { value: 'on_hold', label: 'On Hold' },
                                ],
                            },
                        ]}
                        filterValues={{ status: statusFilter }}
                        onFilterChange={(key, value) => {
                            if (key === 'status') onStatusFilterChange(value);
                        }}
                        pagination
                        pageSize={10}
                        columnVisibility
                        stickyHeader
                        striped
                        hoverable
                        emptyMessage={t("No disbursements match the current filters")}
                        ariaLabel={t("DISBURSEMENT PIPELINE")}
                    />
                </div>
            </div>

            {detailLoan && (
                <LoanDetailModal
                    loan={detailLoan}
                    onClose={() => setDetailLoan(null)}
                />
            )}

            {rejectTarget && (
                <RejectModal
                    disbursementId={rejectTarget.id}
                    borrowerName={rejectTarget.borrowerName}
                    onConfirm={(id, reason) => {
                        onReject(id, reason);
                        setRejectTarget(null);
                    }}
                    onCancel={() => setRejectTarget(null)}
                />
            )}

            {disburseTarget && (
                <DisburseModal
                    entry={disburseTarget}
                    onConfirm={(id) => {
                        onDisburse(id);
                        setDisburseTarget(null);
                    }}
                    onCancel={() => setDisburseTarget(null)}
                />
            )}
        </div>
    );
};

export default DisbursementsEnlite;
