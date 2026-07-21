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
    Scale,
    FileText,
    Clock,
    User,
    DollarSign,
    AlertCircle,
    CheckCircle2,
    XCircle,
} from 'lucide-react';
import StatCard from '../EnliteUI/Cards/StatCard';
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
    const { format } = useCurrencyFormat();
    const formatAmount = (amount: number | null): string =>
        amount === null ? '—' : format(amount, 'RWF');

    const [searchTerm, setSearchTerm]   = useState('');
    const [tierFilter, setTierFilter]   = useState('all');
    const [detailLoan, setDetailLoan]   = useState<any | null>(null);

    // ── Derived metrics — only from real data ─────────────────────────────────

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

    // ── Filtered table data ───────────────────────────────────────────────────

    const filtered = entries.filter(e => {
        const q = searchTerm.toLowerCase();
        const matchSearch =
            (e.borrowerName ?? '').toLowerCase().includes(q) ||
            (e.businessName ?? '').toLowerCase().includes(q) ||
            e.loanId.toLowerCase().includes(q);
        const matchTier = tierFilter === 'all' || e.riskTier === tierFilter;
        return matchSearch && matchTier;
    });

    // ── Table columns ─────────────────────────────────────────────────────────

    const columns = [
        {
            key: 'borrower',
            label: 'BORROWER & LOAN',
            render: (_: any, e: RiskEntry) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 flex-shrink-0">
                        <User size={18} className="text-[#345E85]" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-black text-slate-900 uppercase text-[11px] truncate">
                            {e.borrowerName ?? (
                                <span className="text-slate-400 italic normal-case font-medium">No name on record</span>
                            )}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter font-mono">
                            {e.loanId.substring(0, 8)}…
                        </span>
                    </div>
                </div>
            ),
        },
        {
            key: 'exposure',
            label: 'EXPOSURE',
            render: (_: any, e: RiskEntry) => (
                <div className="flex flex-col">
                    <span className="font-black text-slate-900 text-[11px]">
                        {formatAmount(e.requestedAmount)}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase truncate max-w-[140px]">
                        {e.purpose ?? '—'}
                    </span>
                </div>
            ),
        },
        {
            key: 'credit',
            label: 'CREDIT SCORE',
            render: (_: any, e: RiskEntry) => (
                <div className="flex flex-col gap-1">
                    <span className={`font-black text-[13px] ${scoreColor(e.creditScore)}`}>
                        {e.creditScore !== null ? e.creditScore : (
                            <span className="text-slate-400 text-[10px] font-bold italic normal-case">No score</span>
                        )}
                    </span>
                    {e.riskTier !== null ? (
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase w-fit ${tierStyle[e.riskTier]}`}>
                            {e.riskTier}
                        </span>
                    ) : (
                        <span className="text-[8px] font-bold text-slate-300 uppercase">No tier</span>
                    )}
                </div>
            ),
        },
        {
            key: 'status',
            label: 'STATUS',
            render: (_: any, e: RiskEntry) => (
                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black border uppercase ${statusStyle[e.status] ?? statusStyle.pending}`}>
                    {e.status}
                </span>
            ),
        },
        {
            key: 'due',
            label: 'DUE DATE',
            render: (_: any, e: RiskEntry) => (
                <span className="text-[10px] font-semibold text-slate-600 whitespace-nowrap">
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
                        className="flex items-center gap-2 px-3 py-1.5 bg-[#345E85] text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-opacity-90 transition-all shadow-md shadow-blue-100"
                    >
                        Analyze <ArrowUpRight size={12} />
                    </button>
                </div>
            ),
        },
    ];

    // ── Tabs ──────────────────────────────────────────────────────────────────

    const tabs = [
        { id: 'overview',     label: 'PORTFOLIO OVERVIEW', icon: <TrendingUp size={14} /> },
        { id: 'assessments',  label: 'RISK QUEUE',         icon: <Clock size={14} /> },
    ];

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* ── Stats Row ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Exposure"
                    value={totalExposure > 0 ? formatAmount(totalExposure) : 'N/A'}
                    subtitle={`${entries.length} loan${entries.length !== 1 ? 's' : ''} in portfolio`}
                    icon={<Shield size={22} />}
                    color="primary"
                />
                <StatCard
                    title="Avg Credit Score"
                    value={avgCreditScore !== null ? avgCreditScore.toString() : 'N/A'}
                    subtitle={avgCreditScore !== null
                        ? `${entriesWithScore.length} of ${entries.length} borrowers scored`
                        : 'No credit scores on record'}
                    icon={<Activity size={22} />}
                    color="secondary"
                />
                <StatCard
                    title="Default Rate"
                    value={defaultRate !== null ? `${defaultRate}%` : 'N/A'}
                    subtitle={defaultRate !== null
                        ? `${defaultedCount} defaulted of ${entries.length}`
                        : 'No default data'}
                    icon={<AlertTriangle size={22} />}
                    color="error"
                />
                <StatCard
                    title="High / Critical Risk"
                    value={highRiskRate !== null ? `${highRiskRate}%` : 'N/A'}
                    subtitle={highRiskRate !== null
                        ? `${highRiskCount} of ${entriesWithTier.length} scored loans`
                        : 'No risk tiers available'}
                    icon={<BarChart3 size={22} />}
                    color="warning"
                />
            </div>

            {/* ── Main Layout ── */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">

                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white rounded-2xl border border-slate-100 p-2 shadow-sm">
                        <p className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            Risk Analytics Hub
                        </p>
                        <div className="space-y-1">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => onTabChange(tab.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                                        activeTab === tab.id
                                            ? 'bg-slate-900 text-white shadow-lg shadow-slate-200'
                                            : 'text-slate-500 hover:bg-slate-50'
                                    }`}
                                >
                                    <div className={activeTab === tab.id ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-900'}>
                                        {tab.icon}
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-tight">{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Policy note */}
                    <div className="bg-[#345E85] rounded-2xl p-6 text-white shadow-xl shadow-blue-100 relative overflow-hidden">
                        <div className="relative z-10">
                            <Scale className="mb-4 opacity-50" size={28} />
                            <h4 className="text-sm font-black uppercase tracking-tighter leading-tight">
                                Risk Tier Policy
                            </h4>
                            <p className="text-[10px] font-bold text-blue-100/70 mt-2 uppercase tracking-widest leading-relaxed">
                                Tiers are derived exclusively from verified borrower credit scores.
                                "No tier" means no credit history exists — not a risk signal.
                            </p>
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
                    </div>

                    {/* Status summary */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm space-y-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">
                            Status Breakdown
                        </p>
                        {Object.keys(statusStyle).map(s => {
                            const cnt = entries.filter(e => e.status === s).length;
                            if (cnt === 0) return null;
                            return (
                                <div key={s} className="flex items-center justify-between">
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase ${statusStyle[s]}`}>
                                        {s}
                                    </span>
                                    <span className="text-[11px] font-black text-slate-700">{cnt}</span>
                                </div>
                            );
                        })}
                        {entries.length === 0 && (
                            <p className="text-[10px] text-slate-400 italic">No data</p>
                        )}
                    </div>
                </div>

                {/* Main content */}
                <div className="lg:col-span-3">
                    <DataCard
                        title={tabs.find(t => t.id === activeTab)?.label ?? 'ANALYTICS'}
                        subtitle="Portfolio risk analysis based on verified loan and borrower data"
                    >
                        {/* ── Overview tab ── */}
                        {activeTab === 'overview' && (
                            <div className="space-y-8 pt-2">

                                {/* Risk tier distribution */}
                                {entriesWithTier.length > 0 ? (
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
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
                                                        <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest">
                                                            {tier} Risk
                                                        </span>
                                                        <span className="text-[9px] font-black text-slate-400 uppercase">
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
                                        <p className="text-sm font-bold text-slate-500">No risk tiers available</p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            Risk tiers will appear once borrowers have verified credit scores.
                                        </p>
                                    </div>
                                )}

                                {/* Exposure by status */}
                                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <DollarSign size={12} /> Exposure by Status
                                    </p>
                                    <div className="space-y-3">
                                        {Object.keys(statusStyle).map(s => {
                                            const group = entries.filter(e => e.status === s);
                                            if (group.length === 0) return null;
                                            const exposure = group.reduce((sum, e) => sum + (e.requestedAmount ?? 0), 0);
                                            return (
                                                <div key={s} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase ${statusStyle[s]}`}>
                                                        {s}
                                                    </span>
                                                    <div className="text-right">
                                                        <p className="text-xs font-black text-slate-900">{formatAmount(exposure)}</p>
                                                        <p className="text-[9px] text-slate-400">{group.length} loan{group.length !== 1 ? 's' : ''}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {entries.length === 0 && (
                                            <p className="text-sm text-slate-400 text-center py-4">No loan data available</p>
                                        )}
                                    </div>
                                </div>

                                {/* Defaulted loans detail */}
                                {defaultedCount > 0 && (
                                    <div className="bg-rose-50 rounded-2xl p-6 border border-rose-100">
                                        <p className="text-[10px] font-black text-rose-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <XCircle size={12} /> Defaulted Loans ({defaultedCount})
                                        </p>
                                        <div className="space-y-3">
                                            {entries.filter(e => e.status === 'defaulted').map(e => (
                                                <div key={e.loanId} className="flex items-center justify-between bg-white rounded-xl p-3 border border-rose-100">
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-800">
                                                            {e.borrowerName ?? <span className="text-slate-400 italic">No name</span>}
                                                        </p>
                                                        <p className="text-[9px] text-slate-400 font-mono">{e.loanId.substring(0, 8)}…</p>
                                                    </div>
                                                    <p className="text-xs font-black text-rose-700">{formatAmount(e.requestedAmount)}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Repaid loans */}
                                {entries.filter(e => e.status === 'repaid').length > 0 && (
                                    <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
                                        <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <CheckCircle2 size={12} /> Repaid Loans ({entries.filter(e => e.status === 'repaid').length})
                                        </p>
                                        <p className="text-xs text-emerald-600 font-semibold">
                                            Total recovered: {formatAmount(
                                                entries.filter(e => e.status === 'repaid')
                                                       .reduce((s, e) => s + (e.requestedAmount ?? 0), 0)
                                            )}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Risk Queue tab ── */}
                        {activeTab === 'assessments' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between gap-4 py-2">
                                    <div className="relative flex-1 max-w-md">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input
                                            type="text"
                                            placeholder="SEARCH BORROWERS..."
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black tracking-widest uppercase focus:ring-2 focus:ring-[#345E85] focus:outline-none transition-all"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Filter size={14} className="text-slate-400" />
                                        <select
                                            value={tierFilter}
                                            onChange={e => setTierFilter(e.target.value)}
                                            className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black tracking-widest uppercase focus:outline-none"
                                        >
                                            <option value="all">ALL TIERS</option>
                                            <option value="low">LOW</option>
                                            <option value="medium">MEDIUM</option>
                                            <option value="high">HIGH</option>
                                            <option value="critical">CRITICAL</option>
                                        </select>
                                    </div>
                                </div>

                                <EnhancedTable
                                    columns={columns}
                                    data={filtered}
                                    loading={loading}
                                    emptyMessage="No loans match the current filters"
                                />
                            </div>
                        )}
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

export default RiskAnalysisEnlite;
