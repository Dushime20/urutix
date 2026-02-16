import React from 'react';
import {
    FileText,
    Clock,
    DollarSign,
    TrendingUp,
    Calendar,
    ExternalLink,
    Download
} from 'lucide-react';
import StatCard from '../EnliteUI/Cards/StatCard';
import DataCard from '../EnliteUI/Cards/DataCard';
import EnhancedTable from '../EnliteUI/Tables/EnhancedTable';

interface Route {
    origin: string;
    destination: string;
}

export interface Disbursement {
    id: string;
    loanId: string;
    borrowerName: string;
    amount: number;
    requestedDate: string;
    status: 'pending' | 'approved' | 'disbursed' | 'rejected' | 'on_hold';
    cargoType: string;
    route: Route;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    riskScore: number;
    creditScore: number;
    // Added these to match Page's interface if needed, or unify
    interestRate?: number;
    termMonths?: number;
    documents?: { type: string; status: string }[];
    notes?: string;
}

interface Stats {
    total: number;
    pending: number;
    approved: number;
    disbursed: number;
    totalAmount: number;
    disbursedAmount: number;
    avgProcessingTime: number;
}

interface DisbursementsEnliteProps {
    loading: boolean;
    disbursements: Disbursement[];
    stats: Stats;
    onSort: (key: string) => void;
    sortKey: string;
    sortDirection: 'asc' | 'desc';
    onViewDetails: (disbursement: Disbursement) => void;
    onExport: () => void;
}

const DisbursementsEnlite: React.FC<DisbursementsEnliteProps> = ({
    loading,
    disbursements,
    stats,
    onSort,
    sortKey,
    sortDirection,
    onViewDetails,
    onExport
}) => {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'approved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'disbursed': return 'bg-blue-50 text-[#345E85] border-blue-200';
            case 'rejected': return 'bg-rose-50 text-rose-700 border-rose-200';
            case 'on_hold': return 'bg-orange-50 text-orange-700 border-orange-200';
            default: return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'text-rose-600 bg-rose-50 border-rose-100';
            case 'high': return 'text-orange-600 bg-orange-50 border-orange-100';
            case 'medium': return 'text-amber-600 bg-amber-50 border-amber-100';
            case 'low': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
            default: return 'text-slate-600 bg-slate-50 border-slate-100';
        }
    };

    const columns = [
        {
            key: 'id',
            label: 'REQUEST ID',
            render: (_: any, d: Disbursement) => (
                <span className="font-black text-slate-900 text-[11px] uppercase tracking-tighter">#{d.id}</span>
            ),
            sortable: true
        },
        {
            key: 'borrower',
            label: 'BORROWER & CARGO',
            render: (_: any, d: Disbursement) => (
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 text-xs font-black">
                        {d.borrowerName.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                        <span className="font-black text-slate-900 uppercase tracking-tight text-[11px]">{d.borrowerName}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{d.cargoType}</span>
                    </div>
                </div>
            ),
            sortable: true
        },
        {
            key: 'amount',
            label: 'FUNDING AMOUNT',
            render: (_: any, d: Disbursement) => (
                <div className="flex flex-col">
                    <span className="font-black text-slate-900 text-[11px]">RWF {(d.amount / 1000000).toFixed(1)}M</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Loan Ref: {d.loanId}</span>
                </div>
            ),
            sortable: true
        },
        {
            key: 'status',
            label: 'DISBURSEMENT STATUS',
            render: (_: any, d: Disbursement) => (
                <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${getStatusColor(d.status)}`}>
                    {d.status.replace('_', ' ')}
                </span>
            ),
            sortable: true
        },
        {
            key: 'priority',
            label: 'PRIORITY INDEX',
            render: (_: any, d: Disbursement) => (
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${getPriorityColor(d.priority)}`}>
                    {d.priority}
                </span>
            )
        },
        {
            key: 'requestedDate',
            label: 'REQUEST DATE',
            render: (_: any, d: Disbursement) => (
                <div className="flex items-center gap-2 text-slate-500">
                    <Calendar size={12} />
                    <span className="text-[11px] font-bold">{new Date(d.requestedDate).toLocaleDateString()}</span>
                </div>
            ),
            sortable: true
        },
        {
            key: 'actions',
            label: '',
            render: (_: any, d: Disbursement) => (
                <div className="flex justify-end">
                    <button
                        onClick={() => onViewDetails(d)}
                        className="p-2 text-slate-400 hover:text-[#345E85] hover:bg-blue-50 rounded-lg transition-all"
                        title="Review Details"
                    >
                        <ExternalLink size={14} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Statistics Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Requests"
                    value={stats.total}
                    trend="+12% vs last month"
                    trendDirection="up"
                    icon={<FileText size={24} />}
                    color="primary"
                />
                <StatCard
                    title="Pending Approval"
                    value={stats.pending}
                    subtitle={`Avg wait: ${stats.avgProcessingTime}d`}
                    icon={<Clock size={24} />}
                    color="warning"
                />
                <StatCard
                    title="Total Payload"
                    value={`RWF ${(stats.totalAmount / 1000000).toFixed(1)}M`}
                    subtitle={`Disbursed: ${(stats.disbursedAmount / 1000000).toFixed(1)}M`}
                    icon={<DollarSign size={24} />}
                    color="success"
                />
                <StatCard
                    title="Success Index"
                    value={`${(stats.total > 0 ? (stats.disbursed / stats.total) * 100 : 0).toFixed(1)}%`}
                    trend={`${stats.disbursed} completions`}
                    trendDirection="up"
                    icon={<TrendingUp size={24} />}
                    color="primary"
                />
            </div>

            <DataCard
                title="Disbursement Pipeline"
                subtitle="Manage and authorize loan funding requests"
                actions={
                    <button
                        onClick={onExport}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                    >
                        <Download size={14} /> Export Register
                    </button>
                }
            >
                <EnhancedTable
                    columns={columns}
                    data={disbursements}
                    loading={loading}
                    onSort={onSort}
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                />
            </DataCard>
        </div>
    );
};

export default DisbursementsEnlite;
