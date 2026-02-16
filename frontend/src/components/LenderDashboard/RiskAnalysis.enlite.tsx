import React, { useState } from 'react';
import {
    Activity,
    Shield,
    TrendingUp,
    BarChart3,
    Search,
    Filter,
    ArrowUpRight,
    ExternalLink,
    Download,
    Eye,
    LifeBuoy,
    AlertTriangle,
    Target,
    Calculator,
    Thermometer,
    Scale,
    FileText,
    Clock,
    User
} from 'lucide-react';
import StatCard from '../EnliteUI/Cards/StatCard';
import DataCard from '../EnliteUI/Cards/DataCard';
import EnhancedTable from '../EnliteUI/Tables/EnhancedTable';

export interface RiskAssessment {
    id: string;
    borrowerName: string;
    loanId: string;
    loanAmount: number;
    cargoType: string;
    route: {
        origin: string;
        destination: string;
    };
    riskScore: number;
    riskCategory: 'low' | 'medium' | 'high' | 'critical';
    creditScore: number;
    businessAge: number;
    collateralValue: number;
    debtToIncomeRatio: number;
    paymentHistory: string;
    probabilityOfDefault: number;
    expectedLoss: number;
    collateralCoverageRatio: number;
}

interface RiskAnalysisEnliteProps {
    loading: boolean;
    assessments: RiskAssessment[];
    activeTab: string;
    onTabChange: (tabId: string) => void;
    onViewDetails: (assessment: RiskAssessment) => void;
    metrics: {
        totalExposure: number;
        weightedRiskScore: number;
        portfolioVar: number;
        expectedLoss: number;
        diversificationIndex: number;
    };
}

const RiskAnalysisEnlite: React.FC<RiskAnalysisEnliteProps> = ({
    loading,
    assessments,
    activeTab,
    onTabChange,
    onViewDetails,
    metrics
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [riskFilter, setRiskFilter] = useState('all');

    const tabs = [
        { id: 'overview', label: 'PORTFOLIO VITALITY', icon: <TrendingUp size={14} /> },
        { id: 'assessments', label: 'RISK QUEUE', icon: <Clock size={14} /> },
        { id: 'modeling', label: 'RISK FACTORY', icon: <Calculator size={14} /> },
    ];

    const getRiskColor = (category: string) => {
        switch (category) {
            case 'low': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'medium': return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'high': return 'bg-orange-50 text-orange-700 border-orange-100';
            case 'critical': return 'bg-rose-50 text-rose-700 border-rose-100';
            default: return 'bg-slate-50 text-slate-700 border-slate-100';
        }
    };

    const columns = [
        {
            key: 'borrower',
            label: 'BORROWER & ASSET',
            render: (_: any, item: RiskAssessment) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                        <User size={18} className="text-[#345E85]" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-black text-slate-900 uppercase text-[11px]">{item.borrowerName}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{item.loanId} | {item.cargoType}</span>
                    </div>
                </div>
            )
        },
        {
            key: 'exposure',
            label: 'EXPOSURE',
            render: (_: any, item: RiskAssessment) => (
                <div className="flex flex-col">
                    <span className="font-black text-slate-900 text-[11px]">RWF {(item.loanAmount / 1000000).toFixed(1)}M</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Principal Out.</span>
                </div>
            )
        },
        {
            key: 'risk_score',
            label: 'RISK SCORE',
            render: (_: any, item: RiskAssessment) => (
                <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                        <span className="font-black text-slate-900 text-[13px]">{item.riskScore.toFixed(1)}</span>
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase w-fit ${getRiskColor(item.riskCategory)}`}>
                            {item.riskCategory}
                        </span>
                    </div>
                </div>
            )
        },
        {
            key: 'probability',
            label: 'PD / EL',
            render: (_: any, item: RiskAssessment) => (
                <div className="flex flex-col">
                    <span className="font-black text-rose-600 text-[11px]">{item.probabilityOfDefault}% PD</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">EL: RWF {(item.expectedLoss / 1000).toFixed(0)}K</span>
                </div>
            )
        },
        {
            key: 'actions',
            label: '',
            render: (_: any, item: RiskAssessment) => (
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => onViewDetails(item)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-[#345E85] text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-opacity-90 transition-all shadow-md shadow-blue-100"
                    >
                        Analyze <ArrowUpRight size={12} />
                    </button>
                </div>
            )
        }
    ];

    const filteredAssessments = assessments.filter(a => {
        const matchesSearch = a.borrowerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.loanId.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRisk = riskFilter === 'all' || a.riskCategory === riskFilter;
        return matchesSearch && matchesRisk;
    });

    const renderOverview = () => (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <DataCard title="RISK DISTRIBUTION" subtitle="Portfolio segmentation by categorical risk levels">
                    <div className="space-y-5 pt-4">
                        {['low', 'medium', 'high', 'critical'].map((cat) => {
                            const count = assessments.filter(a => a.riskCategory === cat).length;
                            const pct = assessments.length > 0 ? (count / assessments.length) * 100 : 0;
                            return (
                                <div key={cat} className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest">{cat} Risk</span>
                                        <span className="text-[9px] font-black text-slate-400 uppercase">{pct.toFixed(0)}%</span>
                                    </div>
                                    <div className="h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                        <div
                                            className={`h-full transition-all duration-1000 ${cat === 'low' ? 'bg-emerald-500' :
                                                    cat === 'medium' ? 'bg-amber-500' :
                                                        cat === 'high' ? 'bg-orange-500' : 'bg-rose-500'
                                                }`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </DataCard>

                <DataCard title="CONCENTRATION HEATMAP" subtitle="Risk exposure per commodity / cargo type">
                    <div className="space-y-4 pt-4">
                        {[...new Set(assessments.map(a => a.cargoType))].slice(0, 5).map(cargo => {
                            const apps = assessments.filter(a => a.cargoType === cargo);
                            const avgRisk = apps.reduce((s, a) => s + a.riskScore, 0) / apps.length;
                            return (
                                <div key={cargo} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group hover:border-[#345E85] transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 group-hover:text-[#345E85] border border-slate-100 transition-colors">
                                            <Thermometer size={14} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{cargo}</span>
                                            <span className="text-[8px] font-bold text-slate-400 uppercase">{apps.length} Assets Active</span>
                                        </div>
                                    </div>
                                    <span className={`text-[11px] font-black px-2 py-1 rounded-lg ${avgRisk < 4 ? 'text-emerald-600 bg-emerald-50' :
                                            avgRisk < 7 ? 'text-amber-600 bg-amber-50' : 'text-rose-600 bg-rose-50'
                                        }`}>
                                        {avgRisk.toFixed(1)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </DataCard>
            </div>
        </div>
    );

    const renderRiskQueue = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 py-2">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="SEARCH BORROWERS..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black tracking-widest uppercase focus:ring-2 focus:ring-[#345E85] focus:outline-none transition-all"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter size={14} className="text-slate-400" />
                    <select
                        value={riskFilter}
                        onChange={(e) => setRiskFilter(e.target.value)}
                        className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black tracking-widest uppercase focus:outline-none"
                    >
                        <option value="all">ALL RISK LEVELS</option>
                        <option value="low">LOW</option>
                        <option value="medium">MEDIUM</option>
                        <option value="high">HIGH</option>
                        <option value="critical">CRITICAL</option>
                    </select>
                </div>
            </div>

            <EnhancedTable
                columns={columns}
                data={filteredAssessments}
                loading={loading}
                emptyMessage="No risk assessments found matching current criteria"
            />
        </div>
    );

    const renderModeling = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <DataCard title="SCORING ENGINE" subtitle="Weighted parameters for global risk calculation">
                <div className="space-y-4 pt-4">
                    {[
                        { label: 'Credit History', weight: 35, impact: 'Critical', color: 'bg-rose-500' },
                        { label: 'Collateral Value', weight: 25, impact: 'High', color: 'bg-orange-500' },
                        { label: 'Business Tenure', weight: 20, impact: 'Medium', color: 'bg-[#345E85]' },
                        { label: 'Industry Stability', weight: 20, impact: 'Medium', color: 'bg-indigo-500' },
                    ].map(param => (
                        <div key={param.label} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{param.label}</span>
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{param.impact} Impact Priority</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-black text-slate-900">{param.weight}%</span>
                                <div className={`w-1.5 h-1.5 rounded-full ${param.color}`} />
                            </div>
                        </div>
                    ))}
                    <button className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-200 hover:translate-y-[-2px] transition-all">
                        Adjust Weight Configuration
                    </button>
                </div>
            </DataCard>

            <div className="space-y-6">
                <div className="bg-[#345E85] rounded-3xl p-8 text-white relative overflow-hidden group">
                    <div className="relative z-10">
                        <LifeBuoy className="mb-4 opacity-50" size={32} />
                        <h4 className="text-xl font-black uppercase tracking-tight leading-tight mb-2">Portfolio Shield Active</h4>
                        <p className="text-[11px] font-medium text-blue-100/70 uppercase tracking-widest leading-relaxed">
                            Global risk mitigation protocols are current. No critical breaches detected in active debt portfolio.
                        </p>
                    </div>
                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mb-16 blur-2xl group-hover:scale-150 transition-transform duration-1000" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <Scale size={20} className="text-amber-500 mb-3" />
                        <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1">VaR Balance</h5>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Within Safety Threshold</p>
                    </div>
                    <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <Target size={20} className="text-emerald-500 mb-3" />
                        <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1">Exposure Cap</h5>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">42% Utilization</p>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Metric Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                <StatCard
                    title="Total Exposure"
                    value={`RWF ${(metrics.totalExposure / 1000000).toFixed(1)}M`}
                    subtitle="Portfolio Capital"
                    icon={<Shield size={22} />}
                    color="primary"
                />
                <StatCard
                    title="Weighted Risk"
                    value={metrics.weightedRiskScore.toFixed(1)}
                    subtitle="Avg Portfolio Score"
                    icon={<Activity size={22} />}
                    color="secondary"
                />
                <StatCard
                    title="Value at Risk"
                    value={`RWF ${(metrics.portfolioVar / 1000000).toFixed(1)}M`}
                    subtitle="95% Confidence"
                    icon={<AlertTriangle size={22} />}
                    color="error"
                />
                <StatCard
                    title="Expected Loss"
                    value={`RWF ${(metrics.expectedLoss / 1000).toFixed(0)}K`}
                    subtitle="Stat. Provision"
                    icon={<BarChart3 size={22} />}
                    color="warning"
                />
                <StatCard
                    title="Diversification"
                    value={`${(metrics.diversificationIndex * 100).toFixed(0)}%`}
                    subtitle="Asset Mix Health"
                    icon={<Scale size={22} />}
                    color="success"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                <div className="lg:col-span-1 space-y-4">
                    {/* Navigation */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-2 shadow-sm">
                        <p className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Risk Analytics Hub</p>
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

                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                        <FileText className="mb-3 text-slate-400" size={24} />
                        <h4 className="text-[10px] font-black uppercase text-slate-900 tracking-widest leading-tight">Regulatory Compliance</h4>
                        <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-widest leading-relaxed">
                            Last security audit passed on Aug 2024. All risk models compliant with central bank protocols.
                        </p>
                        <button className="flex items-center gap-2 mt-4 text-[9px] font-black text-[#345E85] uppercase tracking-widest">
                            Review Audit <ExternalLink size={10} />
                        </button>
                    </div>
                </div>

                <div className="lg:col-span-3">
                    <DataCard
                        title={tabs.find(t => t.id === activeTab)?.label || 'ANALYTICS'}
                        subtitle="Deep-dive analysis of borrower defaults and market volatility"
                    >
                        {activeTab === 'overview' && renderOverview()}
                        {activeTab === 'assessments' && renderRiskQueue()}
                        {activeTab === 'modeling' && renderModeling()}
                    </DataCard>
                </div>
            </div>
        </div>
    );
};

export default RiskAnalysisEnlite;
