import React, { useState } from 'react';
import {
    Activity,
    Search,
    User,
    Shield,
    TrendingUp,
    FileText,
    PieChart,
    ChevronRight,
    CheckCircle2,
    XCircle,
    Clock,
    Calculator,
    ArrowUpRight,
    ExternalLink,
    Filter
} from 'lucide-react';
import StatCard from '../EnliteUI/Cards/StatCard';
import DataCard from '../EnliteUI/Cards/DataCard';
import EnhancedTable from '../EnliteUI/Tables/EnhancedTable';

export interface CreditApplication {
    id: string;
    applicantName: string;
    businessName: string;
    applicationDate: string;
    requestedAmount: number;
    purpose: string;
    status: 'pending' | 'in-review' | 'approved' | 'rejected';
    riskLevel: 'low' | 'medium' | 'high';
    creditScore: number;
    industry: string;
    businessAge: number;
}

interface CreditAssessmentEnliteProps {
    loading: boolean;
    applications: CreditApplication[];
    activeTab: string;
    onTabChange: (tabId: string) => void;
    onAssess: (application: CreditApplication) => void;
}

const CreditAssessmentEnlite: React.FC<CreditAssessmentEnliteProps> = ({
    loading,
    applications,
    activeTab,
    onTabChange,
    onAssess
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const tabs = [
        { id: 'overview', label: 'ACTIVE QUEUE', icon: <Clock size={14} /> },
        { id: 'calculator', label: 'CREDIT ENGINE', icon: <Calculator size={14} /> },
        { id: 'reports', label: 'ANALYTICS & BI', icon: <PieChart size={14} /> },
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'rejected': return 'bg-rose-50 text-rose-700 border-rose-100';
            case 'in-review': return 'bg-blue-50 text-[#345E85] border-blue-100';
            default: return 'bg-amber-50 text-amber-700 border-amber-100';
        }
    };

    const getRiskColor = (risk: string) => {
        switch (risk) {
            case 'low': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'medium': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'high': return 'bg-rose-50 text-rose-700 border-rose-200';
            default: return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 750) return 'text-emerald-600';
        if (score >= 650) return 'text-amber-600';
        return 'text-rose-600';
    };

    const filteredApplications = applications.filter(app => {
        const matchesSearch = app.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const columns = [
        {
            key: 'applicant',
            label: 'APPLICANT & PROFILE',
            render: (_: any, app: CreditApplication) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm">
                        <User size={18} className="text-[#345E85]" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-black text-slate-900 uppercase text-[11px]">{app.applicantName}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{app.businessName}</span>
                    </div>
                </div>
            )
        },
        {
            key: 'exposure',
            label: 'LOAN EXPOSURE',
            render: (_: any, app: CreditApplication) => (
                <div className="flex flex-col">
                    <span className="font-black text-slate-900 text-[11px]">RWF {(app.requestedAmount / 1000000).toFixed(1)}M</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">{app.purpose}</span>
                </div>
            )
        },
        {
            key: 'assessment',
            label: 'RISK SCORE',
            render: (_: any, app: CreditApplication) => (
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <span className={`font-black text-[13px] ${getScoreColor(app.creditScore)}`}>{app.creditScore}</span>
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase w-fit ${getRiskColor(app.riskLevel)}`}>
                            {app.riskLevel}
                        </span>
                    </div>
                </div>
            )
        },
        {
            key: 'status',
            label: 'WORKFLOW STATE',
            render: (_: any, app: CreditApplication) => (
                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black border uppercase ${getStatusColor(app.status)}`}>
                    {app.status}
                </span>
            )
        },
        {
            key: 'actions',
            label: '',
            render: (_: any, app: CreditApplication) => (
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => onAssess(app)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-[#345E85] text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-opacity-90 transition-all"
                    >
                        Assess <ArrowUpRight size={12} />
                    </button>
                    <button className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all">
                        <ExternalLink size={14} />
                    </button>
                </div>
            )
        }
    ];

    const renderOverview = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 py-2">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="SEARCH APPLICATIONS..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black tracking-widest uppercase focus:ring-2 focus:ring-[#345E85] focus:outline-none transition-all"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter size={14} className="text-slate-400" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black tracking-widest uppercase focus:outline-none"
                    >
                        <option value="all">ALL STAGES</option>
                        <option value="pending">PENDING</option>
                        <option value="in-review">IN REVIEW</option>
                    </select>
                </div>
            </div>

            <EnhancedTable
                columns={columns}
                data={filteredApplications}
                loading={loading}
                emptyMessage="No pending credit applications found for this quarter"
            />
        </div>
    );

    const renderCalculator = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <h4 className="text-[10px] font-black text-[#345E85] uppercase tracking-widest flex items-center gap-2">
                    <Calculator size={14} /> Parameter Input
                </h4>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Annual Revenue</label>
                        <input type="number" className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold" defaultValue={850000} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Assets</label>
                        <input type="number" className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold" defaultValue={450000} />
                    </div>
                </div>
                <button className="w-full py-3 bg-[#345E85] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100 hover:translate-y-[-2px] transition-all">
                    Run Risk Simulation
                </button>
            </div>

            <div className="bg-slate-900 rounded-2xl p-8 text-white relative overflow-hidden h-full flex flex-col justify-center">
                <div className="relative z-10 text-center">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Simulated Confidence Score</p>
                    <h2 className="text-6xl font-black mb-4">742</h2>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[9px] font-black uppercase tracking-widest">
                        High Probability of Retention
                    </div>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
            </div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Active Assessments"
                    value={applications.length}
                    subtitle="Current Pipeline"
                    icon={<Activity size={24} />}
                    color="primary"
                />
                <StatCard
                    title="Avg Risk Score"
                    value="712"
                    trend="+14"
                    trendDirection="up"
                    icon={<TrendingUp size={24} />}
                    color="secondary"
                />
                <StatCard
                    title="Auto-Approvals"
                    value="12%"
                    subtitle="System confidence"
                    icon={<Shield size={24} />}
                    color="success"
                />
                <StatCard
                    title="Pipeline Velocity"
                    value="2.4d"
                    trend="Stable"
                    trendDirection="neutral"
                    icon={<Clock size={24} />}
                    color="warning"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                {/* Navigation */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white rounded-2xl border border-slate-100 p-2 shadow-sm">
                        <p className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Assessment Console</p>
                        <div className="space-y-1">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => onTabChange(tab.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${activeTab === tab.id
                                        ? 'bg-slate-900 text-white shadow-lg shadow-slate-200'
                                        : 'text-slate-500 hover:bg-slate-50'
                                        }`}
                                >
                                    <div className={`${activeTab === tab.id ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-900'}`}>
                                        {tab.icon}
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-tight">{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-[#345E85] rounded-2xl p-6 text-white shadow-xl shadow-blue-100 relative overflow-hidden group">
                        <div className="relative z-10">
                            <Calculator className="mb-4 opacity-50" size={32} />
                            <h4 className="text-sm font-black uppercase tracking-tighter leading-tight">Proactive Assessment Pattern</h4>
                            <p className="text-[10px] font-bold text-blue-100/70 mt-2 uppercase tracking-widest leading-relaxed">
                                System is monitoring behavioral patterns to adjust risk weights in real-time.
                            </p>
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700" />
                    </div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-3">
                    <DataCard
                        title={tabs.find(t => t.id === activeTab)?.label || 'WORKFLOW'}
                        subtitle="Detailed credit risk analysis and applicant overview"
                    >
                        {activeTab === 'overview' && renderOverview()}
                        {activeTab === 'calculator' && renderCalculator()}
                        {activeTab === 'reports' && (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                <FileText size={48} className="mb-4 opacity-10" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Generating real-time insights...</p>
                            </div>
                        )}
                    </DataCard>
                </div>
            </div>
        </div>
    );
};

export default CreditAssessmentEnlite;
