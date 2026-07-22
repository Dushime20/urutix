import React, { useState } from 'react';
import {
    Shield,
    Search,
    Filter,
    ArrowUpRight,
    User,
} from 'lucide-react';
import DataCard from '../EnliteUI/Cards/DataCard';
import EnhancedTable from '../EnliteUI/Tables/EnhancedTable';
import LoanDetailModal from './LoanDetailModal';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RiskEntry {
    loanId: string;
    borrowerName: string | null;
    businessName: string | null;
    requestedAmount: number | null;
    status: string;
    creditScore: number | null;
    riskTier: 'low' | 'medium' | 'high' | 'critical' | null;
    purpose: string | null;
    requestedSplit: Array<{ type: string; id: string; amount: number }>;
    lenderName: string | null;
    dueDate: string | null;
    createdAt: string | null;
    updatedAt: string | null;
    _rawData?: any;
}

interface RiskAnalysisEnliteProps {
    loading: boolean;
    entries: RiskEntry[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const tierStyle: Record<string, string> = {
    low:      'bg-emerald-50 text-emerald-700 border-emerald-100',
    medium:   'bg-amber-50 text-amber-700 border-amber-100',
    high:     'bg-orange-50 text-orange-700 border-orange-100',
    critical: 'bg-rose-50 text-rose-700 border-rose-100',
};

const statusStyle: Record<string, string> = {
    pending:   'bg-amber-50 text-amber-700 border-amber-100',
    approved:  'bg-emerald-50 text-emerald-700 border-emerald-100',
    rejected:  'bg-rose-50 text-rose-700 border-rose-100',
    disbursed: 'bg-blue-50 text-blue-700 border-blue-100',
    repaid:    'bg-green-50 text-green-700 border-green-100',
    defaulted: 'bg-red-50 text-red-700 border-red-100',
    failed:    'bg-slate-50 text-slate-600 border-slate-100',
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

const RiskAnalysisEnlite: React.FC<RiskAnalysisEnliteProps> = ({
    loading,
    entries,
}) => {
    const { format: fmtCurrency } = useCurrencyFormat();
    const formatAmount = (amount: number | null): string =>
        amount === null ? '—' : fmtCurrency(amount);

    const [searchTerm, setSearchTerm] = useState('');
    const [tierFilter, setTierFilter] = useState('all');
    const [detailLoan, setDetailLoan] = useState<any | null>(null);

    const filtered = entries.filter(e => {
        const q = searchTerm.toLowerCase();
        const matchSearch =
            (e.borrowerName ?? '').toLowerCase().includes(q) ||
            (e.businessName ?? '').toLowerCase().includes(q) ||
            e.loanId.toLowerCase().includes(q);
        const matchTier = tierFilter === 'all' || e.riskTier === tierFilter;
        return matchSearch && matchTier;
    });

    const columns = [
        {
            key: 'borrower',
            label: 'Borrower',
            render: (_: any, e: RiskEntry) => (
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs ring-2 ring-white shadow-sm border border-slate-200 flex-shrink-0">
                        <User size={14} className="text-[#2c5173]" />
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-slate-900 text-sm truncate">
                            {e.borrowerName ?? (
                                <span className="text-slate-400 italic font-medium">No name on record</span>
                            )}
                        </p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium font-mono">
                            {e.loanId.substring(0, 8)}…
                        </p>
                    </div>
                </div>
            ),
        },
        {
            key: 'exposure',
            label: 'Exposure',
            render: (_: any, e: RiskEntry) => (
                <div className="min-w-0">
                    <p className="font-semibold text-slate-900 text-sm">
                        {formatAmount(e.requestedAmount)}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium truncate max-w-[140px]">
                        {e.purpose ?? '—'}
                    </p>
                </div>
            ),
        },
        {
            key: 'credit',
            label: 'Credit Score',
            render: (_: any, e: RiskEntry) => (
                <div className="flex flex-col gap-1">
                    <span className={`font-semibold text-sm ${scoreColor(e.creditScore)}`}>
                        {e.creditScore !== null ? e.creditScore : (
                            <span className="text-slate-400 text-xs font-medium italic">No score</span>
                        )}
                    </span>
                    {e.riskTier !== null ? (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider w-fit ${tierStyle[e.riskTier]}`}>
                            {e.riskTier}
                        </span>
                    ) : (
                        <span className="text-[9px] font-medium text-slate-300 uppercase">No tier</span>
                    )}
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (_: any, e: RiskEntry) => (
                <span className={`inline-flex px-2.5 py-1 rounded-lg text-[9px] font-bold border uppercase tracking-wider ${statusStyle[e.status] ?? statusStyle.pending}`}>
                    {e.status}
                </span>
            ),
        },
        {
            key: 'due',
            label: 'Due Date',
            render: (_: any, e: RiskEntry) => (
                <span className="text-sm font-medium text-slate-600 whitespace-nowrap">
                    {formatDate(e.dueDate)}
                </span>
            ),
        },
        {
            key: 'actions',
            label: '',
            render: (_: any, e: RiskEntry) => (
                <div className="flex justify-end">
                    <button
                        onClick={() => setDetailLoan(e._rawData)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#2c5173] hover:bg-[#1e3850] text-white text-[9px] font-bold uppercase tracking-wider transition-colors shadow-sm"
                    >
                        Analyze <ArrowUpRight size={12} />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-12">
            <DataCard
                title="Risk Queue"
                subtitle="Portfolio risk analysis based on verified loan and borrower data"
                icon={<Shield className="w-5 h-5" />}
                headerColor="primary"
                actions={
                    <div className="flex items-center gap-2">
                        <div className="relative hidden md:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" size={14} />
                            <input
                                type="text"
                                placeholder="SEARCH BORROWERS..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-48 lg:w-56 pl-9 pr-3 py-1.5 bg-white/15 border border-white/20 rounded-md text-[10px] font-bold tracking-widest uppercase text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
                            />
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Filter size={14} className="text-white/70" />
                            <select
                                value={tierFilter}
                                onChange={e => setTierFilter(e.target.value)}
                                className="px-2.5 py-1.5 bg-white/15 border border-white/20 rounded-md text-[10px] font-bold tracking-widest uppercase text-white focus:outline-none"
                            >
                                <option value="all" className="text-slate-900">ALL TIERS</option>
                                <option value="low" className="text-slate-900">LOW</option>
                                <option value="medium" className="text-slate-900">MEDIUM</option>
                                <option value="high" className="text-slate-900">HIGH</option>
                                <option value="critical" className="text-slate-900">CRITICAL</option>
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
                        emptyMessage="No loans match the current filters"
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

export default RiskAnalysisEnlite;
