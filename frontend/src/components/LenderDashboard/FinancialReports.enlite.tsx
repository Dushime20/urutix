import React, { useState } from 'react';
import {
    FileText,
    Download,
    Mail,
    Search,
    Filter,
    Play,
    LayoutTemplate,
    Archive,
} from 'lucide-react';
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
    onDownload,
}) => {
    const [activeTab, setActiveTab] = useState('templates');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'generating': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'failed': return 'bg-rose-50 text-rose-700 border-rose-100';
            case 'scheduled': return 'bg-amber-50 text-amber-700 border-amber-100';
            default: return 'bg-slate-50 text-slate-700 border-slate-100';
        }
    };

    const columns = [
        {
            key: 'report',
            label: 'Document',
            render: (_: any, item: GeneratedReport) => (
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs ring-2 ring-white shadow-sm border border-slate-200 flex-shrink-0">
                        <FileText size={14} className="text-[#2c5173]" />
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-slate-900 text-sm truncate">{item.name}</p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium font-mono">
                            {item.id}
                        </p>
                    </div>
                </div>
            ),
        },
        {
            key: 'metadata',
            label: 'Generated',
            render: (_: any, item: GeneratedReport) => (
                <div className="min-w-0">
                    <p className="font-semibold text-slate-900 text-sm">
                        {new Date(item.generatedAt).toLocaleDateString()}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                        By {item.generatedBy}
                    </p>
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (_: any, item: GeneratedReport) => (
                <span className={`inline-flex px-2.5 py-1 rounded-lg text-[9px] font-bold border uppercase tracking-wider ${getStatusStyle(item.status)}`}>
                    {item.status}
                </span>
            ),
        },
        {
            key: 'file',
            label: 'Size',
            render: (_: any, item: GeneratedReport) => (
                <div className="min-w-0">
                    <p className="font-semibold text-slate-900 text-sm">{item.size}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                        {item.format.toUpperCase()}
                    </p>
                </div>
            ),
        },
        {
            key: 'actions',
            label: '',
            render: (_: any, item: GeneratedReport) => (
                <div className="flex justify-end gap-2">
                    {item.status === 'completed' && (
                        <button
                            onClick={() => onDownload(item)}
                            className="p-2 text-slate-400 hover:text-[#2c5173] transition-colors"
                            title="Download"
                        >
                            <Download size={16} />
                        </button>
                    )}
                    <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors" title="Email">
                        <Mail size={16} />
                    </button>
                </div>
            ),
        },
    ];

    const filteredTemplates = templates.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCat = filterCategory === 'all' || t.category === filterCategory;
        return matchesSearch && matchesCat;
    });

    const tabs = [
        { id: 'templates', label: 'Report Templates', icon: <LayoutTemplate size={14} /> },
        { id: 'recent',    label: 'Document Archive', icon: <Archive size={14} /> },
    ];

    return (
        <div className="space-y-12">
            {/* Tab switcher */}
            <div className="flex items-center gap-2 px-1">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
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
                title={tabs.find(t => t.id === activeTab)?.label ?? 'Reports'}
                subtitle={activeTab === 'templates'
                    ? 'Select a template to generate a financial document'
                    : 'Access and download previously generated reports'}
                icon={activeTab === 'templates'
                    ? <LayoutTemplate className="w-5 h-5" />
                    : <Archive className="w-5 h-5" />}
                headerColor="primary"
                actions={
                    <div className="flex items-center gap-2">
                        <div className="relative hidden md:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" size={14} />
                            <input
                                type="text"
                                placeholder="SEARCH..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-48 lg:w-56 pl-9 pr-3 py-1.5 bg-white/15 border border-white/20 rounded-md text-[10px] font-bold tracking-widest uppercase text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
                            />
                        </div>
                        {activeTab === 'templates' && (
                            <div className="flex items-center gap-1.5">
                                <Filter size={14} className="text-white/70" />
                                <select
                                    value={filterCategory}
                                    onChange={e => setFilterCategory(e.target.value)}
                                    className="px-2.5 py-1.5 bg-white/15 border border-white/20 rounded-md text-[10px] font-bold tracking-widest uppercase text-white focus:outline-none"
                                >
                                    <option value="all" className="text-slate-900">ALL CLASSES</option>
                                    <option value="portfolio" className="text-slate-900">PORTFOLIO</option>
                                    <option value="financial" className="text-slate-900">FINANCIAL</option>
                                    <option value="risk" className="text-slate-900">RISK</option>
                                    <option value="compliance" className="text-slate-900">COMPLIANCE</option>
                                </select>
                            </div>
                        )}
                    </div>
                }
            >
                <div className="space-y-4">
                    <div className="relative md:hidden">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-slate-600 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2c5173]/20 focus:border-[#2c5173]"
                        />
                    </div>

                    {activeTab === 'templates' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredTemplates.length === 0 ? (
                                <div className="col-span-2 py-16 text-center">
                                    <p className="text-sm font-semibold text-slate-500">
                                        No templates match your filters
                                    </p>
                                </div>
                            ) : (
                                filteredTemplates.map(template => (
                                    <div
                                        key={template.id}
                                        className="p-5 bg-white rounded-2xl border border-slate-100 hover:border-[#2c5173] hover:shadow-lg hover:shadow-slate-100 transition-all group flex flex-col justify-between min-h-[180px]"
                                    >
                                        <div>
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-[#2c5173] group-hover:bg-[#2c5173] group-hover:text-white transition-colors border border-slate-200">
                                                    {template.icon}
                                                </div>
                                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg border bg-slate-50 text-slate-500 uppercase tracking-wider">
                                                    {template.estimatedTime}
                                                </span>
                                            </div>
                                            <h5 className="font-semibold text-slate-900 text-sm mb-1">{template.name}</h5>
                                            <p className="text-[10px] text-slate-500 tracking-wider line-clamp-2 leading-relaxed">
                                                {template.description}
                                            </p>
                                        </div>
                                        <div className="mt-4 flex items-center justify-between gap-3">
                                            <button
                                                onClick={() => onViewDetails(template)}
                                                className="flex-1 py-1.5 px-3 bg-slate-50 text-slate-600 rounded-lg text-[9px] font-bold uppercase tracking-wider hover:bg-slate-100 transition-all"
                                            >
                                                View Details
                                            </button>
                                            <button
                                                onClick={() => onGenerate(template)}
                                                className="flex-1 py-1.5 px-3 bg-[#2c5173] hover:bg-[#1e3850] text-white rounded-lg text-[9px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-sm"
                                            >
                                                Generate <Play size={10} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <EnhancedTable
                            columns={columns}
                            data={recentReports}
                            loading={loading}
                            striped
                            hoverable
                            emptyMessage="No reports in archive. Generate a document to get started."
                        />
                    )}
                </div>
            </DataCard>
        </div>
    );
};

export default FinancialReportsEnlite;
