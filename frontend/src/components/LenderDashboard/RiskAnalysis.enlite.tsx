import React, { useState } from 'react';
import {
    Activity,
    Shield,
    TrendingUp,
    BarChart3,
    Search,
    Filter,
    ArrowUpRight,
    AlertTriangle,
    Clock,
    User,
    DollarSign,
    AlertCircle,
    CheckCircle2,
    XCircle,
} from 'lucide-react';
import { StatCard } from '../EnliteUI';
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
    activeTab: string;
    onTabChange: (tabId: string) => void;
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
    activeTab,
    onTabChange,
}) => {
    const { format: fmtCurrency, compact: compactAmount } = useCurrencyFormat();
    const formatAmount = (amount: number | null): string =>
        amount === null ? '—' : fmtCurrency(amount);

    const [searchTerm, setSearchTerm] = useState('');
    const [tierFilter, setTierFilter] = useState('all');
    const [detailLoan, setDetailLoan] = useState<any | null>(null);

    const totalExposure = entries.reduce((s, e) => s + (e.requestedAmount ?? 0), 0);

    const entriesWithScore = entries.filter(e => e.creditScore !== null);
    const avgCreditScore   = entriesWithScore.length > 0
        ? Math.round(entriesWithScore.reduce((s, e) => s + e.creditScore!, 0) / entriesWithScore.length)
        : null;

    const defaultedCount  = entries.filter(e => e.status === 'defaulted').length;
    const defaultRate     = entries.length > 0
        ? ((defaultedCount / entries.length) * 100).toFixed(1)
        : null;

    const entriesWithTier = entries.filter(e => e.riskTier !== null);
    const highRiskCount   = entries.filter(e => e.riskTier === 'high' || e.riskTier === 'critical').length;
    const highRiskRate    = entriesWithTier.length > 0
        ? Math.round((highRiskCount / entriesWithTier.length) * 100)
        : null;

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

    const tabs = [
        { id: 'overview',    label: 'Portfolio Overview', icon: <TrendingUp size={14} /> },
        { id: 'assessments', label: 'Risk Queue',         icon: <Clock size={14} /> },
    ];

    return (
        <div className="space-y-12">
            {/* Analytics Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Exposure"
                    value={totalExposure > 0 ? compactAmount(totalExposure) : '—'}
                    subtitle={`${entries.length} loan${entries.length !== 1 ? 's' : ''} in portfolio`}
                    icon={<Shield size={18} />}
                    color="primary"
                    variant="classic"
                    loading={loading && entries.length === 0}
                />
                <StatCard
                    title="Avg Credit Score"
                    value={avgCreditScore !== null ? avgCreditScore.toString() : '—'}
                    subtitle={avgCreditScore !== null
                        ? `${entriesWithScore.length} of ${entries.length} borrowers scored`
                        : 'No credit scores on record'}
                    icon={<Activity size={18} />}
                    color="primary"
                    variant="classic"
                    loading={loading && entries.length === 0}
                />
                <StatCard
                    title="Default Rate"
                    value={defaultRate !== null ? `${defaultRate}%` : '—'}
                    subtitle={defaultRate !== null
                        ? `${defaultedCount} defaulted of ${entries.length}`
                        : 'No default data'}
                    icon={<AlertTriangle size={18} />}
                    color="primary"
                    variant="classic"
                    loading={loading && entries.length === 0}
                />
                <StatCard
                    title="High / Critical Risk"
                    value={highRiskRate !== null ? `${highRiskRate}%` : '—'}
                    subtitle={highRiskRate !== null
                        ? `${highRiskCount} of ${entriesWithTier.length} scored loans`
                        : 'No risk tiers available'}
                    icon={<BarChart3 size={18} />}
                    color="primary"
                    variant="classic"
                    loading={loading && entries.length === 0}
                />
            </div>

            {/* Tab switcher */}
            <div className="flex items-center gap-2 px-1">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            activeTab === tab.id
                                ? 'bg-[#2c5173] text-white shadow-lg shadow-[#2c5173]/20'
                                : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'
                        }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Main content */}
            <DataCard
                title={tabs.find(t => t.id === activeTab)?.label ?? 'Analytics'}
                subtitle="Portfolio risk analysis based on verified loan and borrower data"
                icon={activeTab === 'overview'
                    ? <TrendingUp className="w-5 h-5" />
                    : <Shield className="w-5 h-5" />}
                headerColor="primary"
                actions={
                    activeTab === 'assessments' ? (
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
                    ) : undefined
                }
            >
                {/* Overview tab */}
                {activeTab === 'overview' && (
                    <div className="space-y-8">
                        {entriesWithTier.length > 0 ? (
                            <div className="space-y-4">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <AlertCircle size={12} /> Risk Tier Distribution
                                    <span className="font-medium normal-case text-slate-400">
                                        ({entriesWithTier.length} of {entries.length} loans have a credit score)
                                    </span>
                                </p>
                                {(['low', 'medium', 'high', 'critical'] as const).map(tier => {
                                    const cnt = entries.filter(e => e.riskTier === tier).length;
                                    const pct = entriesWithTier.length > 0
                                        ? (cnt / entriesWithTier.length) * 100
                                        : 0;
                                    const barColor = {
                                        low: 'bg-emerald-500',
                                        medium: 'bg-amber-500',
                                        high: 'bg-orange-500',
                                        critical: 'bg-rose-500',
                                    }[tier];
                                    return (
                                        <div key={tier} className="space-y-1.5">
                                            <div className="flex justify-between items-end">
                                                <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">
                                                    {tier} Risk
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">
                                                    {cnt} loan{cnt !== 1 ? 's' : ''} — {pct.toFixed(0)}%
                                                </span>
                                            </div>
                                            <div className="h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                                <div
                                                    className={`h-full transition-all duration-700 ${barColor}`}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 flex flex-col items-center text-center">
                                <AlertCircle size={32} className="text-slate-300 mb-3" />
                                <p className="text-sm font-semibold text-slate-500">No risk tiers available</p>
                                <p className="text-xs text-slate-400 mt-1">
                                    Risk tiers will appear once borrowers have verified credit scores.
                                </p>
                            </div>
                        )}

                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <DollarSign size={12} /> Exposure by Status
                            </p>
                            <div className="space-y-3">
                                {Object.keys(statusStyle).map(s => {
                                    const group = entries.filter(e => e.status === s);
                                    if (group.length === 0) return null;
                                    const exposure = group.reduce((sum, e) => sum + (e.requestedAmount ?? 0), 0);
                                    return (
                                        <div key={s} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${statusStyle[s]}`}>
                                                {s}
                                            </span>
                                            <div className="text-right">
                                                <p className="text-sm font-semibold text-slate-900">{formatAmount(exposure)}</p>
                                                <p className="text-[10px] text-slate-400">{group.length} loan{group.length !== 1 ? 's' : ''}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                                {entries.length === 0 && (
                                    <p className="text-sm text-slate-400 text-center py-4">No loan data available</p>
                                )}
                            </div>
                        </div>

                        {defaultedCount > 0 && (
                            <div className="bg-rose-50 rounded-2xl p-6 border border-rose-100">
                                <p className="text-[10px] font-bold text-rose-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <XCircle size={12} /> Defaulted Loans ({defaultedCount})
                                </p>
                                <div className="space-y-3">
                                    {entries.filter(e => e.status === 'defaulted').map(e => (
                                        <div key={e.loanId} className="flex items-center justify-between bg-white rounded-xl p-3 border border-rose-100">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800">
                                                    {e.borrowerName ?? <span className="text-slate-400 italic">No name</span>}
                                                </p>
                                                <p className="text-[10px] text-slate-400 font-mono">{e.loanId.substring(0, 8)}…</p>
                                            </div>
                                            <p className="text-sm font-semibold text-rose-700">{formatAmount(e.requestedAmount)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {entries.filter(e => e.status === 'repaid').length > 0 && (
                            <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
                                <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <CheckCircle2 size={12} /> Repaid Loans ({entries.filter(e => e.status === 'repaid').length})
                                </p>
                                <p className="text-sm text-emerald-600 font-medium">
                                    Total recovered: {formatAmount(
                                        entries.filter(e => e.status === 'repaid')
                                               .reduce((s, e) => s + (e.requestedAmount ?? 0), 0)
                                    )}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Risk Queue tab */}
                {activeTab === 'assessments' && (
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
                )}
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
