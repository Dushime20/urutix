import React, { useState } from 'react';
import {
    FileText,
    Settings,
    Clock,
    Database,
    CheckCircle2,
    ChevronRight,
    Download,
    Mail,
    Activity,
    AlertCircle,
    Search,
    Filter,
    Play
} from 'lucide-react';
import StatCard from '../EnliteUI/Cards/StatCard';
import DataCard from '../EnliteUI/Cards/DataCard';
import EnhancedTable from '../EnliteUI/Tables/EnhancedTable';

export interface ReportTemplate {
    id: string;
    name: string;
    description: string;
    category: string;
    type: string;
    frequency: string;
    format: string;
    icon: React.ReactNode;
    estimatedTime: string;
    dataPoints: string[];
    isScheduled: boolean;
}

export interface GeneratedReport {
    id: string;
    templateId: string;
    name: string;
    category: string;
    generatedAt: string;
    generatedBy: string;
    format: string;
    size: string;
    status: 'completed' | 'generating' | 'failed' | 'scheduled';
}

interface FinancialReportsEnliteProps {
    loading: boolean;
    templates: ReportTemplate[];
    recentReports: GeneratedReport[];
    onGenerate: (template: ReportTemplate) => void;
    onViewDetails: (template: ReportTemplate) => void;
    onDownload: (report: GeneratedReport) => void;
}

const FinancialReportsEnlite: React.FC<FinancialReportsEnliteProps> = ({
    loading,
    templates,
    recentReports,
    onGenerate,
    onViewDetails,
    onDownload
}) => {
    const [activeTab, setActiveTab] = useState('templates');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'generating': return 'bg-blue-50 text-[#345E85] border-blue-100';
            case 'failed': return 'bg-rose-50 text-rose-700 border-rose-100';
            case 'scheduled': return 'bg-amber-50 text-amber-700 border-amber-100';
            default: return 'bg-slate-50 text-slate-700 border-slate-100';
        }
    };

    const columns = [
        {
            key: 'report',
            label: 'DOCUMENT NAME',
            render: (_: any, item: GeneratedReport) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                        <FileText size={18} className="text-[#345E85]" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-black text-slate-900 uppercase text-[11px]">{item.name}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">ID: {item.id}</span>
                    </div>
                </div>
            )
        },
        {
            key: 'metadata',
            label: 'TIMESTAMP / AUTH',
            render: (_: any, item: GeneratedReport) => (
                <div className="flex flex-col">
                    <span className="font-black text-slate-900 text-[11px]">{new Date(item.generatedAt).toLocaleDateString()}</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">By {item.generatedBy}</span>
                </div>
            )
        },
        {
            key: 'status',
            label: 'STATE',
            render: (_: any, item: GeneratedReport) => (
                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black border uppercase ${getStatusStyle(item.status)}`}>
                    {item.status}
                </span>
            )
        },
        {
            key: 'file',
            label: 'DATA SIZE',
            render: (_: any, item: GeneratedReport) => (
                <div className="flex flex-col">
                    <span className="font-black text-slate-900 text-[11px]">{item.size}</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">{item.format.toUpperCase()}</span>
                </div>
            )
        },
        {
            key: 'actions',
            label: '',
            render: (_: any, item: GeneratedReport) => (
                <div className="flex justify-end gap-2">
                    {item.status === 'completed' && (
                        <button
                            onClick={() => onDownload(item)}
                            className="p-2 text-slate-400 hover:text-[#345E85] transition-colors"
                        >
                            <Download size={16} />
                        </button>
                    )}
                    <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                        <Mail size={16} />
                    </button>
                </div>
            )
        }
    ];

    const filteredTemplates = templates.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCat = filterCategory === 'all' || t.category === filterCategory;
        return matchesSearch && matchesCat;
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Intel Bar */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Report Library"
                    value={templates.length.toString()}
                    subtitle="Available Blueprints"
                    icon={<Database size={22} />}
                    color="primary"
                />
                <StatCard
                    title="Active Cycles"
                    value={templates.filter(t => t.isScheduled).length.toString()}
                    subtitle="Automated Pipelines"
                    icon={<Clock size={22} />}
                    color="secondary"
                />
                <StatCard
                    title="Retention Used"
                    value="24.7 GB"
                    subtitle="67% Policy Limit"
                    icon={<Activity size={22} />}
                    color="warning"
                />
                <StatCard
                    title="Generation Score"
                    value="98.2%"
                    subtitle="Success Reliability"
                    icon={<CheckCircle2 size={22} />}
                    color="success"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                {/* Control Panel Sidebar */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-slate-900 rounded-3xl p-6 text-white relative overflow-hidden group shadow-2xl shadow-slate-200">
                        <div className="relative z-10">
                            <Settings className="mb-4 text-blue-400" size={32} />
                            <h4 className="text-sm font-black uppercase tracking-tighter leading-tight">Master Config</h4>
                            <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest leading-relaxed">
                                Customize global reporting parameters, retention policies, and automated distribution lists.
                            </p>
                            <button className="w-full mt-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border border-white/10">
                                Open Schedule Manager
                            </button>
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 p-2 shadow-sm">
                        <p className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">Navigation Nodes</p>
                        <button
                            onClick={() => setActiveTab('templates')}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group ${activeTab === 'templates' ? 'bg-[#345E85] text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <span className="text-[10px] font-black uppercase tracking-tight">Report Templates</span>
                            <ChevronRight size={14} className={activeTab === 'templates' ? 'opacity-100' : 'opacity-0'} />
                        </button>
                        <button
                            onClick={() => setActiveTab('recent')}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group ${activeTab === 'recent' ? 'bg-[#345E85] text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <span className="text-[10px] font-black uppercase tracking-tight">Active Queue</span>
                            <ChevronRight size={14} className={activeTab === 'recent' ? 'opacity-100' : 'opacity-0'} />
                        </button>
                    </div>

                    <div className="bg-[#345E85]/5 rounded-2xl p-5 border border-[#345E85]/10">
                        <div className="flex items-center gap-2 mb-3">
                            <AlertCircle size={14} className="text-[#345E85]" />
                            <span className="text-[9px] font-black text-[#345E85] uppercase tracking-widest">Storage Policy</span>
                        </div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                            Reports are cleared every 90 days. Export critical audits to external archival nodes.
                        </p>
                    </div>
                </div>

                {/* Main Content Terminal */}
                <div className="lg:col-span-3">
                    <DataCard
                        title={activeTab === 'templates' ? "REPORTING BLUEPRINTS" : "DOCUMENT HISTORIC"}
                        subtitle={activeTab === 'templates' ? "Select a template node to initialize document generation" : "Access and monitor previously generated audit documents"}
                    >
                        <div className="space-y-6">
                            <div className="flex items-center justify-between gap-4 py-2 mt-2">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="SEARCH NODES..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black tracking-widest uppercase focus:ring-2 focus:ring-[#345E85] transition-all focus:outline-none"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Filter size={14} className="text-slate-400" />
                                    <select
                                        value={filterCategory}
                                        onChange={(e) => setFilterCategory(e.target.value)}
                                        className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black tracking-widest uppercase focus:outline-none"
                                    >
                                        <option value="all">ALL CLASSES</option>
                                        <option value="portfolio">PORTFOLIO</option>
                                        <option value="financial">FINANCIAL</option>
                                        <option value="risk">RISK</option>
                                        <option value="compliance">COMPLIANCE</option>
                                    </select>
                                </div>
                            </div>

                            {activeTab === 'templates' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {filteredTemplates.map(template => (
                                        <div key={template.id} className="p-5 bg-white rounded-2xl border border-slate-100 hover:border-[#345E85] hover:shadow-lg hover:shadow-slate-100 transition-all group flex flex-col justify-between min-h-[180px]">
                                            <div>
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-[#345E85] group-hover:bg-[#345E85] group-hover:text-white transition-colors border border-slate-100">
                                                        {template.icon}
                                                    </div>
                                                    <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase">
                                                        {template.estimatedTime}
                                                    </span>
                                                </div>
                                                <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-tight mb-1">{template.name}</h5>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest line-clamp-2 leading-relaxed">
                                                    {template.description}
                                                </p>
                                            </div>
                                            <div className="mt-4 flex items-center justify-between gap-3">
                                                <button
                                                    onClick={() => onViewDetails(template)}
                                                    className="flex-1 py-1.5 px-3 bg-slate-50 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
                                                >
                                                    Analysis Parameters
                                                </button>
                                                <button
                                                    onClick={() => onGenerate(template)}
                                                    className="flex-1 py-1.5 px-3 bg-[#345E85] text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
                                                >
                                                    Execute <Play size={10} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <EnhancedTable
                                    columns={columns}
                                    data={recentReports}
                                    loading={loading}
                                    emptyMessage="Archive is empty. Generate a document to initialize queue."
                                />
                            )}
                        </div>
                    </DataCard>
                </div>
            </div>
        </div>
    );
};

export default FinancialReportsEnlite;
