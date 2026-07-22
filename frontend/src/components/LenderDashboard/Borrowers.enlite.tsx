import React from 'react';
import {
    Users,
    TrendingUp,
    Search,
    ChevronRight,
    Mail,
    Phone,
    Briefcase,
    DollarSign,
    AlertCircle,
    Clock,
    User,
    Filter,
} from 'lucide-react';
import { StatCard } from '../EnliteUI';
import DataCard from '../EnliteUI/Cards/DataCard';
import EnhancedTable from '../EnliteUI/Tables/EnhancedTable';
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
    inactive:  'bg-slate-50 text-slate-600 border-slate-100',
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
    const { format: fmtCurrency, compact: compactAmount } = useCurrencyFormat();
    const formatAmount = (amount: number | null | undefined): string =>
        amount == null ? '—' : fmtCurrency(amount);

    const totalBorrowers = borrowers.length;
    const activeBorrowers = borrowers.filter(b => b.status === 'active').length;
    const borrowersWithScore = borrowers.filter(b => b.creditScore !== null);
    const avgCreditScore = borrowersWithScore.length > 0
        ? Math.round(borrowersWithScore.reduce((s, b) => s + b.creditScore!, 0) / borrowersWithScore.length)
        : null;
    const totalOutstanding = borrowers.reduce((s, b) => s + b.outstanding, 0);
    const totalDefaulted   = borrowers.reduce((s, b) => s + b.defaultedLoans, 0);
    const totalLoans       = borrowers.reduce((s, b) => s + b.loanCount, 0);
    const defaultRate      = totalLoans > 0 ? ((totalDefaulted / totalLoans) * 100).toFixed(1) : null;

    const filtered = borrowers.filter(b => {
        const q = searchTerm.toLowerCase();
        const matchSearch =
            (b.companyName ?? '').toLowerCase().includes(q) ||
            (b.contactName ?? '').toLowerCase().includes(q) ||
            (b.email ?? '').toLowerCase().includes(q) ||
            b.borrowerId.toLowerCase().includes(q);
        const matchStatus = statusFilter === 'all' || b.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const columns = [
        {
            key: 'borrower',
            label: 'Borrower',
            render: (_: any, b: BorrowerEntry) => (
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shadow-sm flex-shrink-0">
                        <User size={14} className="text-[#2c5173]" />
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-slate-900 text-sm truncate">
                            {b.companyName ?? b.contactName ?? (
                                <span className="text-slate-400 italic font-medium">No name on record</span>
                            )}
                        </p>
                        {b.businessType && (
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium flex items-center gap-1">
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
                        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
                            <Mail size={10} className="text-slate-400" /> {b.email}
                        </div>
                    )}
                    {b.phone && (
                        <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
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
                    <p className="font-semibold text-slate-900 text-sm">
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
                    <p className="font-semibold text-slate-900 text-sm">
                        {formatAmount(b.outstanding > 0 ? b.outstanding : null)}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
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
                    <span className="text-sm font-medium text-slate-600 whitespace-nowrap">
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
                        className="p-2 hover:bg-slate-50 rounded-xl transition-all group"
                        title="View borrower details"
                    >
                        <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all" />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-12">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Borrowers"
                    value={totalBorrowers.toString()}
                    subtitle={`${activeBorrowers} active`}
                    icon={<Users size={18} />}
                    color="primary"
                    variant="classic"
                    loading={loading && borrowers.length === 0}
                />
                <StatCard
                    title="Avg Credit Score"
                    value={avgCreditScore !== null ? avgCreditScore.toString() : '—'}
                    subtitle={avgCreditScore !== null
                        ? `${borrowersWithScore.length} of ${totalBorrowers} scored`
                        : 'No credit scores on record'}
                    icon={<TrendingUp size={18} />}
                    color="primary"
                    variant="classic"
                    loading={loading && borrowers.length === 0}
                />
                <StatCard
                    title="Outstanding"
                    value={totalOutstanding > 0 ? compactAmount(totalOutstanding) : '—'}
                    subtitle={totalOutstanding > 0 ? 'Across all borrowers' : 'All settled'}
                    icon={<DollarSign size={18} />}
                    color="primary"
                    variant="classic"
                    loading={loading && borrowers.length === 0}
                />
                <StatCard
                    title="Default Rate"
                    value={defaultRate !== null ? `${defaultRate}%` : '—'}
                    subtitle={defaultRate !== null
                        ? `${totalDefaulted} of ${totalLoans} loans`
                        : 'No default data'}
                    icon={<AlertCircle size={18} />}
                    color="primary"
                    variant="classic"
                    loading={loading && borrowers.length === 0}
                />
            </div>

            <DataCard
                title="Borrower Directory"
                subtitle="Verified borrowers from loan history"
                icon={<Users className="w-5 h-5" />}
                headerColor="primary"
                actions={
                    <div className="flex items-center gap-2">
                        <div className="relative hidden md:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" size={14} />
                            <input
                                type="text"
                                placeholder="SEARCH BORROWERS..."
                                value={searchTerm}
                                onChange={e => onSearchChange(e.target.value)}
                                className="w-48 lg:w-56 pl-9 pr-3 py-1.5 bg-white/15 border border-white/20 rounded-md text-[10px] font-bold tracking-widest uppercase text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
                            />
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Filter size={14} className="text-white/70" />
                            <select
                                value={statusFilter}
                                onChange={e => onStatusFilterChange(e.target.value)}
                                className="px-2.5 py-1.5 bg-white/15 border border-white/20 rounded-md text-[10px] font-bold tracking-widest uppercase text-white focus:outline-none"
                            >
                                <option value="all" className="text-slate-900">ALL STATUS</option>
                                <option value="active" className="text-slate-900">ACTIVE</option>
                                <option value="inactive" className="text-slate-900">INACTIVE</option>
                                <option value="suspended" className="text-slate-900">SUSPENDED</option>
                                <option value="pending" className="text-slate-900">PENDING</option>
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
                            placeholder="Search borrowers..."
                            value={searchTerm}
                            onChange={e => onSearchChange(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-slate-600 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2c5173]/20 focus:border-[#2c5173]"
                        />
                    </div>
                    <EnhancedTable
                        columns={columns}
                        data={filtered}
                        loading={loading}
                        striped
                        hoverable
                        emptyMessage="No borrowers found"
                    />
                </div>
            </DataCard>
        </div>
    );
};

export default BorrowersEnlite;
