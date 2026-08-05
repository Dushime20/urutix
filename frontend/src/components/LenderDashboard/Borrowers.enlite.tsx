import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
    Users,
    Mail,
    Phone,
    Briefcase,
    Clock,
    User,
    Eye,
    X,
    DollarSign,
    FileText,
    CheckCircle,
    AlertCircle,
} from 'lucide-react';
import { StandardDataTable } from '../EnliteUI/Tables';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';

export interface BorrowerEntry {
    borrowerId: string;
    companyName: string | null;
    contactName: string | null;
    email: string | null;
    phone: string | null;
    businessType: string | null;
    creditScore: number | null;
    status: string | null;
    createdAt: string | null;
    loanCount: number;
    activeLoans: number;
    pendingLoans: number;
    repaidLoans: number;
    defaultedLoans: number;
    overdueLoans: number;
    totalRequested: number;
    totalApproved: number;
    totalInterestPaid: number;
    totalPrincipalPaid: number;
    outstanding: number;
    lastLoanDate: string | null;
}

interface BorrowersEnliteProps {
    loading: boolean;
    borrowers: BorrowerEntry[];
    searchTerm: string;
    statusFilter: string;
    onSearchChange: (v: string) => void;
    onStatusFilterChange: (v: string) => void;
}

const statusStyle: Record<string, string> = {
    active:    'bg-emerald-50 text-emerald-700 border-emerald-100',
    inactive:  'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border-slate-100 dark:border-slate-800',
    suspended: 'bg-rose-50 text-rose-700 border-rose-100',
    pending:   'bg-amber-50 text-amber-700 border-amber-100',
};

const scoreColor = (score: number | null): string => {
    if (score === null) return 'text-slate-400';
    if (score >= 750) return 'text-emerald-600';
    if (score >= 650) return 'text-amber-600';
    return 'text-rose-600';
};

const formatDate = (iso: string | null): string => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
    });
};

const borrowerDisplayName = (b: BorrowerEntry): string | null =>
    b.companyName ?? b.contactName ?? null;

interface BorrowerDetailModalProps {
    borrower: BorrowerEntry;
    onClose: () => void;
    formatAmount: (amount: number | null | undefined) => string;
}

const BorrowerDetailModal: React.FC<BorrowerDetailModalProps> = ({
    borrower: b,
    onClose,
    formatAmount,
}) => {
    const name = borrowerDisplayName(b);

    return createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full my-8 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 rounded-t-3xl">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                            Borrower <span className="text-blue-600 dark:text-blue-400">Details</span>
                        </h2>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">
                            ID: {b.borrowerId?.substring(0, 8)}…
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/50 dark:hover:bg-slate-800 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                    </button>
                </div>

                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 flex-shrink-0">
                                <User size={20} className="text-[#2c5173]" />
                            </div>
                            <div className="min-w-0">
                                <p className="font-black text-lg text-slate-900 dark:text-white truncate">
                                    {name ?? 'No name on record'}
                                </p>
                                {b.contactName && b.companyName && (
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{b.contactName}</p>
                                )}
                            </div>
                        </div>
                        {b.status && (
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded border uppercase tracking-wider flex-shrink-0 ${statusStyle[b.status] ?? statusStyle.pending}`}>
                                {b.status}
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 p-4 space-y-3">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                <User size={12} /> Contact
                            </p>
                            <div className="space-y-2">
                                {b.email ? (
                                    <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                        <Mail size={12} className="text-slate-400" /> {b.email}
                                    </div>
                                ) : null}
                                {b.phone ? (
                                    <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                        <Phone size={12} className="text-slate-400" /> {b.phone}
                                    </div>
                                ) : null}
                                {b.businessType ? (
                                    <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                        <Briefcase size={12} className="text-slate-400" /> {b.businessType}
                                    </div>
                                ) : null}
                                {!b.email && !b.phone && !b.businessType && (
                                    <span className="text-sm text-slate-400 italic">No contact info</span>
                                )}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 p-4 space-y-3">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                <FileText size={12} /> Credit
                            </p>
                            <p className={`text-2xl font-black ${scoreColor(b.creditScore)}`}>
                                {b.creditScore !== null ? b.creditScore : '—'}
                            </p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                                Member since {formatDate(b.createdAt)}
                            </p>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 p-4 space-y-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <DollarSign size={12} /> Borrowing Summary
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Amount Borrowed</p>
                                <p className="text-lg font-black text-slate-900 dark:text-white">{formatAmount(b.totalApproved)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Outstanding</p>
                                <p className="text-lg font-black text-slate-900 dark:text-white">{formatAmount(b.outstanding)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Total Requested</p>
                                <p className="text-lg font-black text-slate-900 dark:text-white">{formatAmount(b.totalRequested)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Principal Paid</p>
                                <p className="text-lg font-black text-emerald-600">{formatAmount(b.totalPrincipalPaid)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Interest Paid</p>
                                <p className="text-lg font-black text-slate-900 dark:text-white">{formatAmount(b.totalInterestPaid)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Last Loan</p>
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                    <Clock size={12} className="text-slate-400" /> {formatDate(b.lastLoanDate)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 p-4 space-y-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loan Activity</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {b.loanCount} loan{b.loanCount !== 1 ? 's' : ''} total
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {b.activeLoans > 0 && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-bold uppercase border border-blue-100">
                                    <CheckCircle size={10} /> {b.activeLoans} active
                                </span>
                            )}
                            {b.repaidLoans > 0 && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase border border-emerald-100">
                                    <CheckCircle size={10} /> {b.repaidLoans} repaid
                                </span>
                            )}
                            {b.pendingLoans > 0 && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-[10px] font-bold uppercase border border-amber-100">
                                    <Clock size={10} /> {b.pendingLoans} pending
                                </span>
                            )}
                            {b.defaultedLoans > 0 && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 text-[10px] font-bold uppercase border border-rose-100">
                                    <AlertCircle size={10} /> {b.defaultedLoans} defaulted
                                </span>
                            )}
                            {b.overdueLoans > 0 && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-50 text-orange-700 text-[10px] font-bold uppercase border border-orange-100">
                                    <AlertCircle size={10} /> {b.overdueLoans} overdue
                                </span>
                            )}
                            {b.loanCount === 0 && (
                                <span className="text-sm text-slate-400 italic">No loan activity</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    );
};

const BorrowersEnlite: React.FC<BorrowersEnliteProps> = ({
    loading,
    borrowers,
    searchTerm,
    statusFilter,
    onSearchChange,
    onStatusFilterChange,
}) => {
    const { format: fmtCurrency } = useCurrencyFormat();
    const [selectedBorrower, setSelectedBorrower] = useState<BorrowerEntry | null>(null);

    const formatAmount = (amount: number | null | undefined): string =>
        amount == null || amount === 0 ? '—' : fmtCurrency(amount);

    const columns = [
        {
            key: 'name',
            label: 'Name',
            render: (_: any, b: BorrowerEntry) => {
                const name = borrowerDisplayName(b);
                return (
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm flex-shrink-0">
                            <User size={14} className="text-[#2c5173]" />
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                                {name ?? (
                                    <span className="text-slate-400 italic font-medium">No name on record</span>
                                )}
                            </p>
                            {b.contactName && b.companyName && (
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                    {b.contactName}
                                </p>
                            )}
                        </div>
                    </div>
                );
            },
        },
        {
            key: 'amount_borrowed',
            label: 'Amount Borrowed',
            render: (_: any, b: BorrowerEntry) => (
                <div className="min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">
                        {formatAmount(b.totalApproved)}
                    </p>
                    {b.outstanding > 0 && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">
                            {formatAmount(b.outstanding)} outstanding
                        </p>
                    )}
                </div>
            ),
        },
        {
            key: 'actions',
            label: 'Action',
            render: (_: any, b: BorrowerEntry) => (
                <div className="flex items-center justify-end">
                    <button
                        onClick={() => setSelectedBorrower(b)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#345E85] hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-all border border-transparent hover:border-blue-100"
                        title="View detail"
                    >
                        <Eye size={14} />
                        View detail
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-12">
            <StandardDataTable
                title="Borrower Directory"
                subtitle="Verified borrowers from loan history"
                icon={<Users className="w-5 h-5" />}
                headerColor="primary"
                columns={columns}
                data={borrowers}
                loading={loading}
                getRowId={(row) => row.borrowerId}
                searchable
                searchPlaceholder="Search borrowers…"
                searchKeys={['companyName', 'contactName', 'email', 'borrowerId']}
                searchValue={searchTerm}
                onSearchChange={onSearchChange}
                filters={[
                    {
                        key: 'status',
                        label: 'Status',
                        options: [
                            { value: 'active', label: 'Active' },
                            { value: 'inactive', label: 'Inactive' },
                            { value: 'suspended', label: 'Suspended' },
                            { value: 'pending', label: 'Pending' },
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
                emptyMessage="No borrowers found"
                ariaLabel="Borrower Directory"
            />

            {selectedBorrower && (
                <BorrowerDetailModal
                    borrower={selectedBorrower}
                    onClose={() => setSelectedBorrower(null)}
                    formatAmount={formatAmount}
                />
            )}
        </div>
    );
};

export default BorrowersEnlite;
