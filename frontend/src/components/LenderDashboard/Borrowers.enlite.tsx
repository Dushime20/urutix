import React from 'react';
import {
    Users,
    ChevronRight,
    Mail,
    Phone,
    Briefcase,
    Clock,
    User,
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

const BorrowersEnlite: React.FC<BorrowersEnliteProps> = ({
    loading,
    borrowers,
    searchTerm,
    statusFilter,
    onSearchChange,
    onStatusFilterChange,
}) => {
    const { format: fmtCurrency } = useCurrencyFormat();
    const formatAmount = (amount: number | null | undefined): string =>
        amount == null ? '—' : fmtCurrency(amount);

    const columns = [
        {
            key: 'borrower',
            label: 'Borrower',
            render: (_: any, b: BorrowerEntry) => (
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm flex-shrink-0">
                        <User size={14} className="text-[#2c5173]" />
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                            {b.companyName ?? b.contactName ?? (
                                <span className="text-slate-400 italic font-medium">No name on record</span>
                            )}
                        </p>
                        {b.businessType && (
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium flex items-center gap-1">
                                <Briefcase size={8} /> {b.businessType}
                            </p>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: 'contact',
            label: 'Contact',
            render: (_: any, b: BorrowerEntry) => (
                <div className="flex flex-col gap-0.5">
                    {b.email && (
                        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
                            <Mail size={10} className="text-slate-400" /> {b.email}
                        </div>
                    )}
                    {b.phone && (
                        <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                            <Phone size={10} className="text-slate-400" /> {b.phone}
                        </div>
                    )}
                    {!b.email && !b.phone && (
                        <span className="text-sm text-slate-400 italic">No contact info</span>
                    )}
                </div>
            ),
        },
        {
            key: 'credit',
            label: 'Credit Score',
            render: (_: any, b: BorrowerEntry) => (
                <div className="flex flex-col gap-1">
                    <span className={`font-semibold text-sm ${scoreColor(b.creditScore)}`}>
                        {b.creditScore !== null ? b.creditScore : (
                            <span className="text-slate-400 text-xs font-medium italic">No score</span>
                        )}
                    </span>
                    {b.status && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider w-fit ${statusStyle[b.status] ?? statusStyle.pending}`}>
                            {b.status}
                        </span>
                    )}
                </div>
            ),
        },
        {
            key: 'loans',
            label: 'Loan Activity',
            render: (_: any, b: BorrowerEntry) => (
                <div className="min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">
                        {b.loanCount} loan{b.loanCount !== 1 ? 's' : ''}
                    </p>
                    <div className="flex gap-2 text-[10px] font-medium uppercase tracking-wider">
                        {b.activeLoans > 0 && <span className="text-blue-600">{b.activeLoans} active</span>}
                        {b.repaidLoans > 0 && <span className="text-emerald-600">{b.repaidLoans} repaid</span>}
                        {b.defaultedLoans > 0 && <span className="text-rose-600">{b.defaultedLoans} defaulted</span>}
                        {b.overdueLoans > 0 && <span className="text-orange-600">{b.overdueLoans} overdue</span>}
                    </div>
                </div>
            ),
        },
        {
            key: 'exposure',
            label: 'Exposure',
            render: (_: any, b: BorrowerEntry) => (
                <div className="min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">
                        {formatAmount(b.outstanding > 0 ? b.outstanding : null)}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">
                        {formatAmount(b.totalApproved > 0 ? b.totalApproved : null)} approved
                    </p>
                </div>
            ),
        },
        {
            key: 'last_loan',
            label: 'Last Loan',
            render: (_: any, b: BorrowerEntry) => (
                <div className="flex items-center gap-1.5">
                    <Clock size={11} className="text-slate-400 flex-shrink-0" />
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {formatDate(b.lastLoanDate)}
                    </span>
                </div>
            ),
        },
        {
            key: 'actions',
            label: '',
            render: () => (
                <div className="flex justify-end">
                    <button
                        className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 dark:hover:bg-slate-800 rounded-xl transition-all group"
                        title="View borrower details"
                    >
                        <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-900 dark:text-white dark:hover:text-white group-hover:translate-x-0.5 transition-all" />
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
        </div>
    );
};

export default BorrowersEnlite;
