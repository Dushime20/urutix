import React, { useState } from 'react';
import {
    Activity,
    Search,
    User,
    Shield,
    TrendingUp,
    FileText,
    PieChart,
    Clock,
    Calculator,
    ArrowUpRight,
    ExternalLink,
    Filter,
    AlertCircle,
    DollarSign,
    CheckCircle2,
} from 'lucide-react';
import StatCard from '../EnliteUI/Cards/StatCard';
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
    activeTab: string;
    onTabChange: (tabId: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const statusStyle: Record<string, string> = {
    approved:  'bg-emerald-50 text-emerald-700 border-emerald-100',
    rejected:  'bg-rose-50 text-rose-700 border-rose-100',
    disbursed: 'bg-blue-50 text-[#345E85] border-blue-100',
    repaid:    'bg-green-50 text-green-700 border-green-100',
    failed:    'bg-red-50 text-red-700 border-red-100',
    defaulted: 'bg-orange-50 text-orange-700 border-orange-100',
    pending:   'bg-amber-50 text-amber-700 border-amber-100',
};

const riskStyle: Record<string, string> = {
    low:    'bg-emerald-50 text-emerald-700 border-emerald-200',
    medium: 'bg-amber-50 text-amber-700 border-amber-200',
    high:   'bg-rose-50 text-rose-700 border-rose-200',
};

const scoreColor = (score: number | null): string => {
    if (score === null) return 'text-slate-400';
    if (score >= 750) return 'text-emerald-600';
    if (score >= 650) return 'text-amber-600';
    return 'text-rose-600';
};

const formatAmount = (amount: number | null): string => amount === null ? '—' : amount.toLocaleString(); // replaced by hook inside component

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
    activeTab,
    onTabChange,
}) => {
    const [searchTerm, setSearchTerm]     = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [detailLoan, setDetailLoan]     = useState<any | null>(null);

    // ── Derived stats — only from real data ──────────────────────────────────

    const appsWithScore = applications.filter(a => a.creditScore !== null);
    const avgCreditScore = appsWithScore.length > 0
        ? Math.round(appsWithScore.reduce((s, a) => s + a.creditScore!, 0) / appsWithScore.length)
        : null;

    const approvedCount = applications.filter(a => a.status === 'approved').length;
    const approvalRate  = applications.length > 0
        ? Math.round((approvedCount / applications.length) * 100)
        : null;

    const totalExposure = applications.reduce((s, a) => s + (a.requestedAmount ?? 0), 0);

    // Pipeline velocity: avg days from created_at → updated_at for decided loans
    const decided = applications.filter(
        a => (a.status === 'approved' || a.status === 'rejected') &&
             a.applicationDate && a.updatedAt,
    );
    const avgVelocityDays = decided.length > 0
        ? decided.reduce((s, a) => {
              const diff = new Date(a.updatedAt!).getTime() - new Date(a.applicationDate!).getTime();
              return s + diff / (1000 * 60 * 60 * 24);
          }, 0) / decided.length
        : null;

    // ── Filtered table data ───────────────────────────────────────────────────

    const filtered = applications.filter(app => {
        const q = searchTerm.toLowerCase();
        const matchSearch =
            (app.applicantName ?? '').toLowerCase().includes(q) ||
            (app.businessName  ?? '').toLowerCase().includes(q) ||
            app.id.toLowerCase().includes(q);
        const matchStatus = statusFilter === 'all' || app.status === statusFilter;
        return matchSearch && matchStatus;
    });

    // ── Table columns ─────────────────────────────────────────────────────────

    const columns = [
        {
            key: 'applicant',
            label: 'APPLICANT & PROFILE',
            render: (_: any, app: CreditApplication) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm flex-shrink-0">
                        <User size={18} className="text-[#345E85]" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-black text-slate-900 uppercase text-[11px] truncate">
                            {app.applicantName ?? <span className="text-slate-400 italic normal-case font-medium">No name on record</span>}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter truncate">
                            {app.businessName ?? '—'}
                        </span>
                    </div>
                </div>
            ),
        },
        {
            key: 'exposure',
            label: 'LOAN EXPOSURE',
            render: (_: any, app: CreditApplication) => (
                <div className="flex flex-col">
                    <span className="font-black text-slate-900 text-[11px]">
                        {formatAmount(app.requestedAmount)}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase truncate max-w-[140px]">
                        {app.purpose ?? '—'}
                    </span>
                </div>
            ),
        },
        {
            key: 'risk',
            label: 'RISK SCORE',
            render: (_: any, app: CreditApplication) => (
                <div className="flex flex-col gap-1">
                    <span className={`font-black text-[13px] ${scoreColor(app.creditScore)}`}>
                        {app.creditScore !== null ? app.creditScore : (
                            <span className="text-slate-400 text-[10px] font-bold italic normal-case">No score</span>
                        )}
                    </span>
                    {app.riskLevel !== null ? (
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase w-fit ${riskStyle[app.riskLevel]}`}>
                            {app.riskLevel}
                        </span>
                    ) : (
                        <span className="text-[8px] font-bold text-slate-300 uppercase">—</span>
                    )}
                </div>
            ),
        },
        {
            key: 'status',
            label: 'WORKFLOW STATE',
            render: (_: any, app: CreditApplication) => (
                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black border uppercase ${statusStyle[app.status] ?? statusStyle.pending}`}>
                    {app.status}
                </span>
            ),
        },
        {
            key: 'date',
            label: 'SUBMITTED',
            render: (_: any, app: CreditApplication) => (
                <span className="text-[10px] font-semibold text-slate-600 whitespace-nowrap">
                    {formatDate(app.applicationDate)}
                </span>
            ),
        },
        {
            key: 'actions',
            label: '',
            render: (_: any, app: CreditApplication) => (
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => setDetailLoan(app._rawData)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-[#345E85] text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-opacity-90 transition-all"
                    >
                        Assess <ArrowUpRight size={12} />
                    </button>
                    <button
                        onClick={() => setDetailLoan(app._rawData)}
                        className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all"
                        title="View full details"
                    >
                        <ExternalLink size={14} />
                    </button>
                </div>
            ),
        },
    ];

    // ── Tabs ──────────────────────────────────────────────────────────────────

    const tabs = [
        { id: 'overview',    label: 'ACTIVE QUEUE',   icon: <Clock size={14} /> },
        { id: 'reports',     label: 'ANALYTICS & BI', icon: <PieChart size={14} /> },
    ];

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* ── Stats Row ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Active Assessments"
                    value={applications.length.toString()}
                    subtitle="Pending in queue"
                    icon={<Activity size={24} />}
                    color="primary"
                />
                <StatCard
                    title="Avg Credit Score"
                    value={avgCreditScore !== null ? avgCreditScore.toString() : 'N/A'}
                    subtitle={avgCreditScore !== null
                        ? `Based on ${appsWithScore.length} of ${applications.length} applicants`
                        : 'No credit scores on record'}
                    icon={<TrendingUp size={24} />}
                    color="secondary"
                />
                <StatCard
                    title="Total Exposure"
                    value={totalExposure > 0 ? formatAmount(totalExposure) : 'N/A'}
                    subtitle={`${applications.length} pending request${applications.length !== 1 ? 's' : ''}`}
                    icon={<DollarSign size={24} />}
                    color="warning"
                />
                <StatCard
                    title="Approval Rate"
                    value={approvalRate !== null ? `${approvalRate}%` : 'N/A'}
                    subtitle={approvalRate !== null
                        ? `${approvedCount} approved of ${applications.length}`
                        : 'No decisions yet'}
                    icon={<CheckCircle2 size={24} />}
                    color="success"
                />
            </div>

            {/* ── Pipeline Velocity banner (only shown when real data exists) ── */}
            {avgVelocityDays !== null && (
                <div className="bg-white border border-slate-100 rounded-2xl px-6 py-4 flex items-center gap-4 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <Clock size={18} className="text-[#345E85]" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pipeline Velocity</p>
                        <p className="text-sm font-black text-slate-900">
                            Avg <span className="text-[#345E85]">{avgVelocityDays.toFixed(1)} days</span> from submission to decision
                            <span className="ml-2 text-[10px] font-bold text-slate-400">
                                (based on {decided.length} decided loan{decided.length !== 1 ? 's' : ''})
                            </span>
                        </p>
                    </div>
                </div>
            )}

            {/* ── Main Layout ── */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">

                {/* Sidebar nav */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white rounded-2xl border border-slate-100 p-2 shadow-sm">
                        <p className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            Assessment Console
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

                    {/* Info panel */}
                    <div className="bg-[#345E85] rounded-2xl p-6 text-white shadow-xl shadow-blue-100 relative overflow-hidden">
                        <div className="relative z-10">
                            <Shield className="mb-4 opacity-50" size={32} />
                            <h4 className="text-sm font-black uppercase tracking-tighter leading-tight">
                                Credit Score Policy
                            </h4>
                            <p className="text-[10px] font-bold text-blue-100/70 mt-2 uppercase tracking-widest leading-relaxed">
                                Scores are derived exclusively from verified borrower repayment history.
                                N/A means no history exists yet — not a risk indicator.
                            </p>
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
                    </div>
                </div>

                {/* Main content */}
                <div className="lg:col-span-3">
                    <DataCard
                        title={tabs.find(t => t.id === activeTab)?.label ?? 'WORKFLOW'}
                        subtitle="Detailed credit risk analysis and applicant overview"
                    >
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                {/* Search + filter */}
                                <div className="flex items-center justify-between gap-4 py-2">
                                    <div className="relative flex-1 max-w-md">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input
                                            type="text"
                                            placeholder="SEARCH APPLICATIONS..."
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black tracking-widest uppercase focus:ring-2 focus:ring-[#345E85] focus:outline-none transition-all"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Filter size={14} className="text-slate-400" />
                                        <select
                                            value={statusFilter}
                                            onChange={e => setStatusFilter(e.target.value)}
                                            className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black tracking-widest uppercase focus:outline-none"
                                        >
                                            <option value="all">ALL STAGES</option>
                                            <option value="pending">PENDING</option>
                                            <option value="approved">APPROVED</option>
                                            <option value="rejected">REJECTED</option>
                                            <option value="disbursed">DISBURSED</option>
                                        </select>
                                    </div>
                                </div>

                                <EnhancedTable
                                    columns={columns}
                                    data={filtered}
                                    loading={loading}
                                    emptyMessage="No applications match the current filters"
                                />
                            </div>
                        )}

                        {activeTab === 'reports' && (
                            <div className="space-y-6 py-4">
                                {/* Summary breakdown from real data */}
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {[
                                        { label: 'Pending',   count: applications.filter(a => a.status === 'pending').length,   color: 'bg-amber-50 text-amber-700' },
                                        { label: 'Approved',  count: applications.filter(a => a.status === 'approved').length,  color: 'bg-emerald-50 text-emerald-700' },
                                        { label: 'Rejected',  count: applications.filter(a => a.status === 'rejected').length,  color: 'bg-rose-50 text-rose-700' },
                                        { label: 'Disbursed', count: applications.filter(a => a.status === 'disbursed').length, color: 'bg-blue-50 text-blue-700' },
                                        { label: 'Repaid',    count: applications.filter(a => a.status === 'repaid').length,    color: 'bg-green-50 text-green-700' },
                                        { label: 'Defaulted', count: applications.filter(a => a.status === 'defaulted').length, color: 'bg-orange-50 text-orange-700' },
                                    ].map(({ label, count, color }) => (
                                        <div key={label} className={`rounded-xl p-4 ${color} border border-current/10`}>
                                            <p className="text-[9px] font-black uppercase tracking-widest opacity-70">{label}</p>
                                            <p className="text-2xl font-black mt-1">{count}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Risk distribution — only from apps with real scores */}
                                {appsWithScore.length > 0 ? (
                                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <AlertCircle size={12} /> Risk Distribution
                                            <span className="font-medium normal-case text-slate-400">
                                                ({appsWithScore.length} of {applications.length} applicants have a credit score)
                                            </span>
                                        </p>
                                        <div className="grid grid-cols-3 gap-4">
                                            {(['low', 'medium', 'high'] as const).map(level => {
                                                const cnt = applications.filter(a => a.riskLevel === level).length;
                                                const pct = applications.length > 0 ? Math.round((cnt / applications.length) * 100) : 0;
                                                return (
                                                    <div key={level} className={`rounded-xl p-4 ${riskStyle[level]} border`}>
                                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-70">{level} risk</p>
                                                        <p className="text-2xl font-black mt-1">{cnt}</p>
                                                        <p className="text-[10px] font-bold opacity-60">{pct}% of total</p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 flex flex-col items-center text-center">
                                        <AlertCircle size={32} className="text-slate-300 mb-3" />
                                        <p className="text-sm font-bold text-slate-500">No credit scores on record</p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            Risk distribution will appear once borrowers have completed credit checks.
                                        </p>
                                    </div>
                                )}

                                {/* Exposure breakdown */}
                                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <DollarSign size={12} /> Exposure Breakdown
                                    </p>
                                    <div className="space-y-3">
                                        {applications.map(app => (
                                            <div key={app.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                                                <div>
                                                    <p className="text-xs font-bold text-slate-800">
                                                        {app.applicantName ?? <span className="text-slate-400 italic">No name</span>}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400">{app.purpose ?? '—'}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-black text-slate-900">{formatAmount(app.requestedAmount)}</p>
                                                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase ${statusStyle[app.status] ?? statusStyle.pending}`}>
                                                        {app.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
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

export default CreditAssessmentEnlite;
