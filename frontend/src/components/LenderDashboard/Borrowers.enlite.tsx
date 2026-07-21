import React, { useState } from 'react';
import {
    Users,
    UserCheck,
    Shield,
    TrendingUp,
    Search,
    Download,
    ChevronRight,
    Mail,
    Phone,
    Briefcase,
    DollarSign,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Clock,
    User,
} from 'lucide-react';
import StatCard from '../EnliteUI/Cards/StatCard';
import DataCard from '../EnliteUI/Cards/DataCard';
import EnhancedTable from '../EnliteUI/Tables/EnhancedTable';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

const BorrowersEnlite: React.FC<BorrowersEnliteProps> = ({
    loading,
    borrowers,
    searchTerm,
    statusFilter,
    onSearchChange,
    onStatusFilterChange,
}) => {
    const { format } = useCurrencyFormat();
    const formatAmount = (amount: number | null | undefined): string =>
        amount == null ? '—' : format(amount, 'RWF');

    // ── Derived stats — only from real data ───────────────────────────────────

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

    // ── Filtered data ─────────────────────────────────────────────────────────

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

    // ── Table columns ─────────────────────────────────────────────────────────

    const columns = [
        {
            key: 'borrower',
            label: 'BORROWER',
            render: (_: any, b: BorrowerEntry) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 flex-shrink-0">
                        <User size={18} className="text-[#345E85]" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-black text-slate-900 uppercase text-[11px] truncate">
                            {b.companyName ?? b.contactName ?? (
                                <span className="text-slate-400 italic normal-case font-medium">No name on record</span>
                            )}
                        </span>
                        {b.businessType && (
                            <span className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                <Briefcase size={8} /> {b.businessType}
                            </span>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: 'contact',
            label: 'CONTACT',
            render: (_: any, b: BorrowerEntry) => (
                <div className="flex flex-col gap-0.5">
                    {b.email && (
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-600">
                            <Mail size={10} className="text-slate-400" /> {b.email}
                        </div>
                    )}
                    {b.phone && (
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-600">
                            <Phone size={10} className="text-slate-400" /> {b.phone}
                        </div>
                    )}
                    {!b.email && !b.phone && (
                        <span className="text-[10px] text-slate-400 italic">No contact info</span>
                    )}
                </div>
            ),
        },
        {
            key: 'credit',
            label: 'CREDIT SCORE',
            render: (_: any, b: BorrowerEntry) => (
                <div className="flex flex-col gap-0.5">
                    <span className={`font-black text-[13px] ${scoreColor(b.creditScore)}`}>
                        {b.creditScore !== null ? b.creditScore : (
                            <span className="text-slate-400 text-[10px] font-bold italic normal-case">No score</span>
                        )}
                    </span>
                    {b.status && (
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase w-fit ${statusStyle[b.status] ?? statusStyle.pending}`}>
                            {b.status}
                        </span>
                    )}
                </div>
            ),
        },
        {
            key: 'loans',
            label: 'LOAN ACTIVITY',
            render: (_: any, b: BorrowerEntry) => (
                <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] font-black text-slate-900">
                        {b.loanCount} loan{b.loanCount !== 1 ? 's' : ''}
                    </span>
                    <div className="flex gap-2 text-[9px] font-bold uppercase">
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
            label: 'EXPOSURE',
            render: (_: any, b: BorrowerEntry) => (
                <div className="flex flex-col gap-0.5">
                    <span className="font-black text-slate-900 text-[11px]">
                        {formatAmount(b.outstanding > 0 ? b.outstanding : null)}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase">
                        {formatAmount(b.totalApproved > 0 ? b.totalApproved : null)} approved
                    </span>
                </div>
            ),
        },
        {
            key: 'last_loan',
            label: 'LAST LOAN',
            render: (_: any, b: BorrowerEntry) => (
                <div className="flex items-center gap-1.5">
                    <Clock size={11} className="text-slate-400 flex-shrink-0" />
                    <span className="text-[10px] font-semibold text-slate-600 whitespace-nowrap">
                        {formatDate(b.lastLoanDate)}
                    </span>
                </div>
            ),
        },
        {
            key: 'actions',
            label: '',
            render: (_: any, b: BorrowerEntry) => (
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

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* ── Stats Row ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Borrowers"
                    value={totalBorrowers.toString()}
                    subtitle={`${activeBorrowers} active`}
                    icon={<Users size={24} />}
                    color="primary"
                />
                <StatCard
                    title="Avg Credit Score"
                    value={avgCreditScore !== null ? avgCreditScore.toString() : 'N/A'}
                    subtitle={avgCreditScore !== null
                        ? `${borrowersWithScore.length} of ${totalBorrowers} scored`
                        : 'No credit scores on record'}
                    icon={<TrendingUp size={24} />}
                    color="secondary"
                />
                <StatCard
                    title="Outstanding"
                    value={totalOutstanding > 0 ? formatAmount(totalOutstanding) : 'N/A'}
                    subtitle={totalOutstanding > 0 ? 'Across all borrowers' : 'All settled'}
                    icon={<DollarSign size={24} />}
                    color="warning"
                />
                <StatCard
                    title="Default Rate"
                    value={defaultRate !== null ? `${defaultRate}%` : 'N/A'}
                    subtitle={defaultRate !== null
                        ? `${totalDefaulted} of ${totalLoans} loans`
                        : 'No default data'}
                    icon={<AlertCircle size={24} />}
                    color={totalDefaulted > 0 ? 'error' : 'success'}
                />
            </div>

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
                            const cnt = borrowers.filter(b => b.status === s).length;
                            if (cnt === 0) return null;
                            return (
                                <div key={s} className="flex items-center justify-between py-1">
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase ${statusStyle[s]}`}>
                                        {s}
                                    </span>
                                    <span className="text-[11px] font-black text-slate-700">{cnt}</span>
                                </div>
                            );
                        })}
                        {borrowers.length === 0 && (
                            <p className="text-[10px] text-slate-400 italic">No data</p>
                        )}
                    </div>

                    {/* Defaulted alert */}
                    {totalDefaulted > 0 && (
                        <div className="bg-rose-50 rounded-2xl border border-rose-100 p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <XCircle size={16} className="text-rose-600" />
                                <p className="text-[10px] font-black text-rose-700 uppercase tracking-widest">
                                    {totalDefaulted} Defaulted Loan{totalDefaulted !== 1 ? 's' : ''}
                                </p>
                            </div>
                            <p className="text-xs text-rose-600">
                                Across {borrowers.filter(b => b.defaultedLoans > 0).length} borrower{borrowers.filter(b => b.defaultedLoans > 0).length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    )}

                    {/* Overdue alert */}
                    {borrowers.some(b => b.overdueLoans > 0) && (
                        <div className="bg-orange-50 rounded-2xl border border-orange-100 p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertCircle size={16} className="text-orange-600" />
                                <p className="text-[10px] font-black text-orange-700 uppercase tracking-widest">
                                    {borrowers.reduce((s, b) => s + b.overdueLoans, 0)} Overdue
                                </p>
                            </div>
                            <p className="text-xs text-orange-600">
                                Across {borrowers.filter(b => b.overdueLoans > 0).length} borrower{borrowers.filter(b => b.overdueLoans > 0).length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    )}

                    {/* Policy note */}
                    <div className="bg-[#345E85] rounded-2xl p-5 text-white shadow-xl shadow-blue-100 relative overflow-hidden">
                        <div className="relative z-10">
                            <Shield className="mb-3 opacity-50" size={24} />
                            <h4 className="text-[11px] font-black uppercase tracking-tighter leading-tight">
                                Data Policy
                            </h4>
                            <p className="text-[9px] font-bold text-blue-100/70 mt-2 uppercase tracking-widest leading-relaxed">
                                Borrower records are derived exclusively from verified loan history.
                                Only borrowers with at least one loan appear here.
                            </p>
                        </div>
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12" />
                    </div>
                </div>

                {/* Main table */}
                <div className="lg:col-span-3">
                    <DataCard
                        title="BORROWER DIRECTORY"
                        subtitle="Verified borrowers from loan history"
                    >
                        <div className="space-y-6">
                            <div className="flex items-center justify-between gap-4 py-2 mt-2">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="SEARCH BORROWERS..."
                                        value={searchTerm}
                                        onChange={e => onSearchChange(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black tracking-widest uppercase focus:ring-2 focus:ring-[#345E85] focus:outline-none transition-all"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <select
                                        value={statusFilter}
                                        onChange={e => onStatusFilterChange(e.target.value)}
                                        className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black tracking-widest uppercase focus:outline-none"
                                    >
                                        <option value="all">ALL STATUS</option>
                                        <option value="active">ACTIVE</option>
                                        <option value="inactive">INACTIVE</option>
                                        <option value="suspended">SUSPENDED</option>
                                        <option value="pending">PENDING</option>
                                    </select>
                                </div>
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
            </div>
        </div>
    );
};

export default BorrowersEnlite;
