import React, { useState } from 'react';
import {
    Search,
    User,
    Clock,
    ArrowUpRight,
    Filter,
} from 'lucide-react';
import DataCard from '../EnliteUI/Cards/DataCard';
import EnhancedTable from '../EnliteUI/Tables/EnhancedTable';
import LoanDetailModal from './LoanDetailModal';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreditApplication {
    id: string;
    applicantName: string | null;
    businessName: string | null;
    applicationDate: string | null;
    requestedAmount: number | null;
    purpose: string | null;
    status: 'pending' | 'approved' | 'rejected' | 'disbursed' | 'repaid' | 'failed' | 'defaulted';
    riskLevel: 'low' | 'medium' | 'high' | null;
    creditScore: number | null;
    requestedSplit: Array<{ type: string; id: string; amount: number }>;
    lenderName: string | null;
    dueDate: string | null;
    updatedAt: string | null;
    _rawData?: any;
}

interface CreditAssessmentEnliteProps {
    loading: boolean;
    applications: CreditApplication[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const statusStyle: Record<string, string> = {
    approved:  'bg-emerald-50 text-emerald-700 border-emerald-100',
    rejected:  'bg-rose-50 text-rose-700 border-rose-100',
    disbursed: 'bg-blue-50 text-blue-700 border-blue-100',
    repaid:    'bg-green-50 text-green-700 border-green-100',
    failed:    'bg-red-50 text-red-700 border-red-100',
    defaulted: 'bg-orange-50 text-orange-700 border-orange-100',
    pending:   'bg-amber-50 text-amber-700 border-amber-100',
};

const riskStyle: Record<string, string> = {
    low:    'bg-emerald-50 text-emerald-700 border-emerald-100',
    medium: 'bg-amber-50 text-amber-700 border-amber-100',
    high:   'bg-rose-50 text-rose-700 border-rose-100',
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

const CreditAssessmentEnlite: React.FC<CreditAssessmentEnliteProps> = ({
    loading,
    applications,
}) => {
    const { format } = useCurrencyFormat();
    const formatAmount = (amount: number | null): string =>
        amount === null ? '—' : format(amount, 'RWF');

    const [searchTerm, setSearchTerm]     = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [detailLoan, setDetailLoan]     = useState<any | null>(null);

    const filtered = applications.filter(app => {
        const q = searchTerm.toLowerCase();
        const matchSearch =
            (app.applicantName ?? '').toLowerCase().includes(q) ||
            (app.businessName ?? '').toLowerCase().includes(q) ||
            app.id.toLowerCase().includes(q);
        const matchStatus = statusFilter === 'all' || app.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const columns = [
        {
            key: 'applicant',
            label: 'Applicant',
            render: (_: any, app: CreditApplication) => (
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs ring-2 ring-white shadow-sm border border-slate-200 flex-shrink-0">
                        <User size={14} className="text-[#2c5173]" />
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-slate-900 text-sm truncate">
                            {app.applicantName ?? (
                                <span className="text-slate-400 italic font-medium">No name on record</span>
                            )}
                        </p>
                        {app.businessName && (
                            <p className="text-[10px] text-slate-500 truncate uppercase tracking-wider font-medium">
                                {app.businessName}
                            </p>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: 'amount',
            label: 'Requested',
            render: (_: any, app: CreditApplication) => (
                <span className="text-sm font-bold text-slate-900">{formatAmount(app.requestedAmount)}</span>
            ),
        },
        {
            key: 'score',
            label: 'Credit Score',
            render: (_: any, app: CreditApplication) => (
                <span className={`text-sm font-black ${scoreColor(app.creditScore)}`}>
                    {app.creditScore ?? '—'}
                </span>
            ),
        },
        {
            key: 'risk',
            label: 'Risk',
            render: (_: any, app: CreditApplication) =>
                app.riskLevel ? (
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${riskStyle[app.riskLevel]}`}>
                        {app.riskLevel}
                    </span>
                ) : (
                    <span className="text-[10px] text-slate-400">—</span>
                ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (_: any, app: CreditApplication) => (
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${statusStyle[app.status] ?? statusStyle.pending}`}>
                    {app.status}
                </span>
            ),
        },
        {
            key: 'date',
            label: 'Submitted',
            render: (_: any, app: CreditApplication) => (
                <span className="text-sm font-medium text-slate-600 whitespace-nowrap">
                    {formatDate(app.applicationDate)}
                </span>
            ),
        },
        {
            key: 'actions',
            label: '',
            render: (_: any, app: CreditApplication) => (
                <div className="flex justify-end">
                    <button
                        onClick={() => setDetailLoan(app._rawData)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#2c5173] hover:bg-[#1e3850] text-white text-[9px] font-bold uppercase tracking-wider transition-colors shadow-sm"
                    >
                        Assess <ArrowUpRight size={12} />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-12">
            <DataCard
                title="Active Queue"
                subtitle="Credit risk analysis and applicant overview"
                icon={<Clock className="w-5 h-5" />}
                headerColor="primary"
                actions={
                    <div className="flex items-center gap-2">
                        <div className="relative hidden md:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" size={14} />
                            <input
                                type="text"
                                placeholder="SEARCH APPLICATIONS..."
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
                                <option value="all" className="text-slate-900">ALL STAGES</option>
                                <option value="pending" className="text-slate-900">PENDING</option>
                                <option value="approved" className="text-slate-900">APPROVED</option>
                                <option value="rejected" className="text-slate-900">REJECTED</option>
                                <option value="disbursed" className="text-slate-900">DISBURSED</option>
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
                            placeholder="Search applications..."
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
                        emptyMessage="No applications match the current filters"
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

export default CreditAssessmentEnlite;
