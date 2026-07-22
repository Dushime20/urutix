import React, { useState } from 'react';
import {
    Activity,
    Search,
    User,
    TrendingUp,
    PieChart,
    Clock,
    ArrowUpRight,
    Filter,
    AlertCircle,
    DollarSign,
    CheckCircle2,
} from 'lucide-react';
import { StatCard } from '../EnliteUI';
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
    activeTab,
    onTabChange,
}) => {
    const { format, compact: compactAmount } = useCurrencyFormat();
    const formatAmount = (amount: number | null): string =>
        amount === null ? '—' : format(amount, 'RWF');

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
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium truncate">
                            {app.businessName ?? '—'}
                        </p>
                    </div>
                </div>
            ),
        },
        {
            key: 'exposure',
            label: 'Exposure',
            render: (_: any, app: CreditApplication) => (
                <div className="min-w-0">
                    <p className="font-semibold text-slate-900 text-sm">
                        {formatAmount(app.requestedAmount)}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium truncate max-w-[140px]">
                        {app.purpose ?? '—'}
                    </p>
                </div>
            ),
        },
        {
            key: 'risk',
            label: 'Credit Score',
            render: (_: any, app: CreditApplication) => (
                <div className="flex flex-col gap-1">
                    <span className={`font-semibold text-sm ${scoreColor(app.creditScore)}`}>
                        {app.creditScore !== null ? app.creditScore : (
                            <span className="text-slate-400 text-xs font-medium italic">No score</span>
                        )}
                    </span>
                    {app.riskLevel !== null ? (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider w-fit ${riskStyle[app.riskLevel]}`}>
                            {app.riskLevel}
                        </span>
                    ) : (
                        <span className="text-[9px] font-medium text-slate-300 uppercase">—</span>
                    )}
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (_: any, app: CreditApplication) => (
                <span className={`inline-flex px-2.5 py-1 rounded-lg text-[9px] font-bold border uppercase tracking-wider ${statusStyle[app.status] ?? statusStyle.pending}`}>
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

    // ── Tabs ──────────────────────────────────────────────────────────────────

    const tabs = [
        { id: 'overview', label: 'Active Queue', icon: <Clock size={14} /> },
        { id: 'reports',  label: 'Analytics',    icon: <PieChart size={14} /> },
    ];

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-12">
            {/* Analytics Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Active Assessments"
                    value={applications.length.toString()}
                    subtitle={avgVelocityDays !== null
                        ? `Avg ${avgVelocityDays.toFixed(1)}d to decision`
                        : 'Pending in queue'}
                    icon={<Activity size={18} />}
                    color="primary"
                    variant="classic"
                    loading={loading && applications.length === 0}
                />
                <StatCard
                    title="Avg Credit Score"
                    value={avgCreditScore !== null ? avgCreditScore.toString() : '—'}
                    subtitle={avgCreditScore !== null
                        ? `${appsWithScore.length} of ${applications.length} applicants scored`
                        : 'No credit scores on record'}
                    icon={<TrendingUp size={18} />}
                    color="primary"
                    variant="classic"
                    loading={loading && applications.length === 0}
                />
                <StatCard
                    title="Total Exposure"
                    value={totalExposure > 0 ? compactAmount(totalExposure) : '—'}
                    subtitle={`${applications.length} request${applications.length !== 1 ? 's' : ''}`}
                    icon={<DollarSign size={18} />}
                    color="primary"
                    variant="classic"
                    loading={loading && applications.length === 0}
                />
                <StatCard
                    title="Approval Rate"
                    value={approvalRate !== null ? `${approvalRate}%` : '—'}
                    subtitle={approvalRate !== null
                        ? `${approvedCount} approved of ${applications.length}`
                        : 'No decisions yet'}
                    icon={<CheckCircle2 size={18} />}
                    color="primary"
                    variant="classic"
                    loading={loading && applications.length === 0}
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
                title={tabs.find(t => t.id === activeTab)?.label ?? 'Assessment'}
                subtitle="Credit risk analysis and applicant overview"
                icon={activeTab === 'overview'
                    ? <Clock className="w-5 h-5" />
                    : <PieChart className="w-5 h-5" />}
                headerColor="primary"
                actions={
                    activeTab === 'overview' ? (
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
                    ) : undefined
                }
            >
                {activeTab === 'overview' && (
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
                )}

                {activeTab === 'reports' && (
                    <div className="space-y-8">
                        {/* Status breakdown */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {[
                                { label: 'Pending',   count: applications.filter(a => a.status === 'pending').length,   color: 'bg-amber-50 text-amber-700 border-amber-100' },
                                { label: 'Approved',  count: applications.filter(a => a.status === 'approved').length,  color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
                                { label: 'Rejected',  count: applications.filter(a => a.status === 'rejected').length,  color: 'bg-rose-50 text-rose-700 border-rose-100' },
                                { label: 'Disbursed', count: applications.filter(a => a.status === 'disbursed').length, color: 'bg-blue-50 text-blue-700 border-blue-100' },
                                { label: 'Repaid',    count: applications.filter(a => a.status === 'repaid').length,    color: 'bg-green-50 text-green-700 border-green-100' },
                                { label: 'Defaulted', count: applications.filter(a => a.status === 'defaulted').length, color: 'bg-orange-50 text-orange-700 border-orange-100' },
                            ].map(({ label, count, color }) => (
                                <div key={label} className={`rounded-2xl p-4 border ${color}`}>
                                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">{label}</p>
                                    <p className="text-2xl font-semibold mt-1">{count}</p>
                                </div>
                            ))}
                        </div>

                        {/* Risk distribution */}
                        {appsWithScore.length > 0 ? (
                            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
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
                                            <div key={level} className={`rounded-xl p-4 border ${riskStyle[level]}`}>
                                                <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">{level} risk</p>
                                                <p className="text-2xl font-semibold mt-1">{cnt}</p>
                                                <p className="text-[10px] text-slate-500 font-medium">{pct}% of total</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 flex flex-col items-center text-center">
                                <AlertCircle size={32} className="text-slate-300 mb-3" />
                                <p className="text-sm font-semibold text-slate-500">No credit scores on record</p>
                                <p className="text-xs text-slate-400 mt-1">
                                    Risk distribution will appear once borrowers have completed credit checks.
                                </p>
                            </div>
                        )}

                        {/* Exposure breakdown */}
                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <DollarSign size={12} /> Exposure Breakdown
                            </p>
                            <div className="space-y-3">
                                {applications.map(app => (
                                    <div key={app.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-800">
                                                {app.applicantName ?? <span className="text-slate-400 italic">No name</span>}
                                            </p>
                                            <p className="text-[10px] text-slate-500">{app.purpose ?? '—'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-slate-900">{formatAmount(app.requestedAmount)}</p>
                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${statusStyle[app.status] ?? statusStyle.pending}`}>
                                                {app.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {applications.length === 0 && (
                                    <p className="text-sm text-slate-400 text-center py-4">No application data available</p>
                                )}
                            </div>
                        </div>
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

export default CreditAssessmentEnlite;
