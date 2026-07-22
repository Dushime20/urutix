import React from 'react';
import {
    PieChart,
    Activity,
    Shield,
    Globe,
    Download,
    ChevronRight,
    ArrowUpRight,
    ArrowDownLeft
} from 'lucide-react';
import DataCard from '../EnliteUI/Cards/DataCard';
import EnhancedTable from '../EnliteUI/Tables/EnhancedTable';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';

export interface PortfolioData {
    totalLoans: number;
    totalValue: number;
    activeLoans: number;
    completedLoans: number;
    defaultedLoans: number;
    averageInterestRate: number;
    averageLoanTerm: number;
    totalInterestEarned: number;
    portfolioYield: number;
    riskScore: number;
    diversificationScore: number;
    monthlyGrowth: number;
    collectionRate: number;
}

export interface LoanPerformance {
    month: string;
    disbursed: number;
    collected: number;
    defaults: number;
    netIncome: number;
}

interface PortfolioAnalyticsEnliteProps {
    loading: boolean;
    portfolioData: PortfolioData;
    performanceData: LoanPerformance[];
    riskMetrics: {
        lowRisk: number;
        mediumRisk: number;
        highRisk: number;
        totalExposure: number;
    };
    geographicData: any[];
    cargoAnalysis: any[];
    timeframe: string;
    onTimeframeChange: (timeframe: string) => void;
    onExport: () => void;
    children?: React.ReactNode;
}

const PortfolioAnalyticsEnlite: React.FC<PortfolioAnalyticsEnliteProps> = ({
    loading,
    portfolioData,
    performanceData,
    riskMetrics,
    geographicData,
    cargoAnalysis,
    timeframe,
    onTimeframeChange,
    onExport,
    children
}) => {
    const { compact: formatCurrency } = useCurrencyFormat();

    const riskColumns = [
        {
            key: 'cargoType',
            label: 'ASSET CLASS',
            render: (_: unknown, row: any) => (
                <div className="flex flex-col">
                    <span className="font-black text-slate-900 text-[11px] uppercase tracking-tight">{row.cargoType}</span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{row.loanCount} Active Positions</span>
                </div>
            )
        },
        {
            key: 'totalValue',
            label: 'EXPOSURE',
            render: (_: unknown, row: any) => (
                <span className="font-black text-slate-900 text-[11px]">{formatCurrency(row.totalValue)}</span>
            )
        },
        {
            key: 'riskLevel',
            label: 'RISK PROFILE',
            render: (_: unknown, row: any) => (
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${row.riskLevel === 'low' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                    row.riskLevel === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                        row.riskLevel === 'high' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                            'bg-slate-50 text-slate-600 border-slate-100'
                    }`}>
                    {row.riskLevel}
                </span>
            )
        },
        {
            key: 'defaultRate',
            label: 'DEFAULT RATE',
            render: (_: unknown, row: any) => (
                <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-[60px]">
                        <div
                            className={`h-full rounded-full ${row.defaultRate > 5 ? 'bg-rose-500' : 'bg-[#345E85]'}`}
                            style={{ width: `${Math.min(row.defaultRate * 10, 100)}%` }}
                        />
                    </div>
                    <span className="font-bold text-slate-600 text-[10px]">{row.defaultRate}%</span>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Performance Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <DataCard
                        title="Institutional Performance Matrix"
                        subtitle="Comparative analysis of disbursements vs collections"
                        icon={<Activity size={18} />}
                        actions={
                            <div className="flex items-center gap-2">
                                <select
                                    value={timeframe}
                                    onChange={(e) => onTimeframeChange(e.target.value)}
                                    className="bg-slate-50 border-none text-[10px] font-black uppercase tracking-widest rounded-lg px-3 py-1.5 outline-none ring-1 ring-slate-200 focus:ring-[#345E85] transition-all text-slate-600 cursor-pointer"
                                >
                                    <option value="3months">90 Days</option>
                                    <option value="6months">180 Days</option>
                                    <option value="12months">365 Days</option>
                                </select>
                                <button
                                    onClick={onExport}
                                    className="p-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all active:scale-95"
                                >
                                    <Download size={14} />
                                </button>
                            </div>
                        }
                    >
                        <div className="h-[300px] w-full mt-4">
                            {children}
                        </div>

                        <div className="grid grid-cols-3 gap-4 mt-6">
                            <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md group">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-blue-50 text-[#345E85] rounded-lg group-hover:scale-110 transition-transform">
                                        <ArrowUpRight size={14} />
                                    </div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Disbursed</span>
                                </div>
                                <div className="text-lg font-black text-slate-900">{formatCurrency(performanceData[performanceData.length - 1]?.disbursed || 0)}</div>
                            </div>
                            <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md group">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-[#345E85] text-white rounded-lg group-hover:scale-110 transition-transform">
                                        <ArrowDownLeft size={14} />
                                    </div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Collected</span>
                                </div>
                                <div className="text-lg font-black text-slate-900">{formatCurrency(performanceData[performanceData.length - 1]?.collected || 0)}</div>
                            </div>
                            <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md group">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-slate-100 text-slate-600 rounded-lg group-hover:scale-110 transition-transform">
                                        <PieChart size={14} />
                                    </div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Net Alpha</span>
                                </div>
                                <div className="text-lg font-black text-slate-900">{formatCurrency(performanceData[performanceData.length - 1]?.netIncome || 0)}</div>
                            </div>
                        </div>
                    </DataCard>
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <DataCard title="Risk Topography" icon={<Shield size={18} />}>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Portfolio Risk Score</span>
                                    <div className="text-2xl font-black text-slate-900">{portfolioData.riskScore}/10</div>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-sm">
                                    {Math.round((portfolioData.riskScore / 10) * 100)}%
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-emerald-600">Low Risk Exposure</span>
                                    <span className="text-slate-900">{formatCurrency(riskMetrics.lowRisk)}</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(riskMetrics.lowRisk / riskMetrics.totalExposure) * 100}%` }} />
                                </div>

                                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest pt-2">
                                    <span className="text-amber-600">Medium Risk Exposure</span>
                                    <span className="text-slate-900">{formatCurrency(riskMetrics.mediumRisk)}</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(riskMetrics.mediumRisk / riskMetrics.totalExposure) * 100}%` }} />
                                </div>

                                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest pt-2">
                                    <span className="text-rose-600">High Risk Exposure</span>
                                    <span className="text-slate-900">{formatCurrency(riskMetrics.highRisk)}</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-rose-500 rounded-full" style={{ width: `${(riskMetrics.highRisk / riskMetrics.totalExposure) * 100}%` }} />
                                </div>
                            </div>
                        </div>
                    </DataCard>

                    <DataCard title="Concentration Analysis" icon={<Globe size={18} />}>
                        <div className="space-y-4">
                            {geographicData.slice(0, 4).map((region, idx) => (
                                <div key={idx} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 font-black text-[10px] group-hover:bg-blue-50 group-hover:text-[#345E85] transition-all border border-transparent group-hover:border-blue-100">
                                            {region.region.charAt(0)}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{region.region}</span>
                                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{region.loanCount} Active Loans</span>
                                        </div>
                                    </div>
                                    <div className="text-[11px] font-black text-slate-900">{formatCurrency(region.totalValue)}</div>
                                </div>
                            ))}
                            <button className="w-full mt-2 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-[#345E85] transition-colors flex items-center justify-center gap-2">
                                View Full Distribution <ChevronRight size={10} />
                            </button>
                        </div>
                    </DataCard>
                </div>
            </div>

            {/* Detailed Asset Table */}
            <DataCard
                title="Asset Class Distribution"
                subtitle="Granular analysis of portfolio performance by cargo category"
                icon={<PieChart size={18} />}
            >
                <EnhancedTable
                    columns={riskColumns}
                    data={cargoAnalysis}
                    loading={loading}
                    emptyMessage="No asset class data available for analysis"
                />
            </DataCard>
        </div>
    );
};

export default PortfolioAnalyticsEnlite;
