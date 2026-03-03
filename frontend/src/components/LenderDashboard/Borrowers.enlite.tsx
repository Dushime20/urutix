import React from 'react';
import {
    Users,
    UserCheck,
    Shield,
    Search,
    Download,
    Plus,
    ChevronRight,
    Mail,
    Phone,
    Briefcase
} from 'lucide-react';
import StatCard from '../EnliteUI/Cards/StatCard';
import DataCard from '../EnliteUI/Cards/DataCard';
import EnhancedTable from '../EnliteUI/Tables/EnhancedTable';

export interface BorrowerProfile {
    id: string;
    name: string;
    email: string;
    phone: string;
    company?: string;
    address: string;
    status: 'active' | 'inactive' | 'suspended' | 'pending';
    creditScore: number;
    riskRating: 'low' | 'medium' | 'high' | 'critical';
    totalLoans: number;
    totalBorrowed: number;
    outstandingAmount: number;
    verificationStatus: 'verified' | 'pending' | 'rejected';
    lastActivity: string;
}

interface BorrowersEnliteProps {
    loading: boolean;
    borrowers: BorrowerProfile[];
    analytics: {
        totalBorrowers: number;
        activeBorrowers: number;
        verifiedBorrowers: number;
        averageCreditScore: number;
    };
    searchTerm: string;
    onSearchChange: (term: string) => void;
    statusFilter: string;
    onStatusFilterChange: (status: string) => void;
    onAddBorrower: () => void;
    onViewDetails: (borrower: BorrowerProfile) => void;
    onExport: () => void;
}

const BorrowersEnlite: React.FC<BorrowersEnliteProps> = ({
    loading,
    borrowers,
    analytics,
    searchTerm,
    onSearchChange,
    statusFilter,
    onStatusFilterChange,
    onAddBorrower,
    onViewDetails,
    onExport
}) => {
    const formatCurrency = (amount: number) => {
        if (amount >= 1000000) return `RWF ${(amount / 1000000).toFixed(1)}M`;
        if (amount >= 1000) return `RWF ${(amount / 1000).toFixed(0)}K`;
        return `RWF ${amount.toLocaleString()}`;
    };

    const columns = [
        {
            key: 'name',
            label: 'BORROWER IDENTITY',
            render: (_: unknown, row: BorrowerProfile) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xs shadow-lg shadow-slate-200">
                        {row.name.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                        <span className="font-black text-slate-900 text-[11px] uppercase tracking-tight">{row.name}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                <Briefcase size={8} /> {row.company || 'Private'}
                            </span>
                        </div>
                    </div>
                </div>
            )
        },
        {
            key: 'contact',
            label: 'CONNECTIVITY',
            render: (_: unknown, row: BorrowerProfile) => (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600">
                        <Mail size={10} className="text-slate-400" /> {row.email}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600">
                        <Phone size={10} className="text-slate-400" /> {row.phone}
                    </div>
                </div>
            )
        },
        {
            key: 'credit',
            label: 'CREDIT ENGINE',
            render: (_: unknown, row: BorrowerProfile) => (
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-black ${row.creditScore >= 700 ? 'text-emerald-600' : row.creditScore >= 600 ? 'text-[#345E85]' : 'text-slate-500'}`}>
                            {row.creditScore}
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Score</span>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-[0.1em] mt-1 ${row.riskRating === 'low' ? 'text-emerald-500' :
                        row.riskRating === 'medium' ? 'text-amber-500' :
                            row.riskRating === 'high' ? 'text-rose-500' : 'text-red-900'
                        }`}>
                        {row.riskRating} Risk
                    </span>
                </div>
            )
        },
        {
            key: 'exposure',
            label: 'PORTFOLIO EXPOSURE',
            render: (_: unknown, row: BorrowerProfile) => (
                <div className="flex flex-col">
                    <span className="font-black text-slate-900 text-[11px]">{formatCurrency(row.outstandingAmount)}</span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{row.totalLoans} Total Positions</span>
                </div>
            )
        },
        {
            key: 'status',
            label: 'OPERATIONAL STATE',
            render: (_: unknown, row: BorrowerProfile) => (
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${row.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                    row.status === 'suspended' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                        row.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                            'bg-slate-50 text-slate-600 border-slate-100'
                    }`}>
                    {row.status}
                </span>
            )
        },
        {
            key: 'actions',
            label: '',
            render: (_: unknown, row: BorrowerProfile) => (
                <button
                    onClick={() => onViewDetails(row)}
                    className="p-2 hover:bg-slate-50 rounded-xl transition-all group"
                >
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all" />
                </button>
            )
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Network"
                    value={analytics.totalBorrowers.toString()}
                    trend="+12%"
                    trendDirection="up"
                    icon={<Users size={24} />}
                    color="primary"
                    subtitle="Scale Metrics"
                />
                <StatCard
                    title="Active Capital"
                    value={analytics.activeBorrowers.toString()}
                    trend="+5%"
                    trendDirection="up"
                    icon={<UserCheck size={24} />}
                    color="success"
                    subtitle="Live Utilization"
                />
                <StatCard
                    title="Verification Flow"
                    value={analytics.verifiedBorrowers.toString()}
                    trend="Stable"
                    trendDirection="neutral"
                    icon={<Shield size={24} />}
                    color="info"
                    subtitle="Compliance State"
                />
                <StatCard
                    title="Network Alpha"
                    value={analytics.averageCreditScore.toString()}
                    trend="Optimal"
                    trendDirection="up"
                    icon={<TrendingUp size={24} />}
                    color="accent"
                    subtitle="Mean Credit Engine"
                />
            </div>

            {/* Main Action Interface */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3">
                    <DataCard
                        title="Institutional Borrower Registry"
                        subtitle="Centralized management of credit-linked identities"
                        icon={<Users size={18} />}
                        actions={
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                    <input
                                        type="text"
                                        placeholder="SEARCH IDENTITY..."
                                        value={searchTerm}
                                        onChange={(e) => onSearchChange(e.target.value)}
                                        className="bg-slate-50 border-none text-[10px] font-black uppercase tracking-widest rounded-xl pl-9 pr-4 py-2 outline-none ring-1 ring-slate-100 focus:ring-slate-900 transition-all w-64"
                                    />
                                </div>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => onStatusFilterChange(e.target.value)}
                                    className="bg-slate-50 border-none text-[10px] font-black uppercase tracking-widest rounded-xl px-4 py-2 outline-none ring-1 ring-slate-100 focus:ring-slate-900 transition-all cursor-pointer"
                                >
                                    <option value="all">ALL CLASSES</option>
                                    <option value="active">ACTIVE</option>
                                    <option value="pending">PENDING</option>
                                    <option value="suspended">SUSPENDED</option>
                                </select>
                                <button
                                    onClick={onExport}
                                    className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all active:scale-95"
                                >
                                    <Download size={16} />
                                </button>
                                <button
                                    onClick={onAddBorrower}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200"
                                >
                                    <Plus size={14} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Onboard</span>
                                </button>
                            </div>
                        }
                    >
                        <EnhancedTable
                            columns={columns}
                            data={borrowers}
                            loading={loading}
                            emptyMessage="No institutional identities found in the current parameters"
                        />
                    </DataCard>
                </div>

                <div className="space-y-6">
                    <DataCard title="Risk Intelligence" icon={<Shield size={18} />}>
                        <div className="space-y-5">
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Risk Distribution</span>
                                    <span className="text-[10px] font-black text-slate-900">12.4% Variance</span>
                                </div>
                                <div className="flex h-3 rounded-full overflow-hidden bg-slate-100">
                                    <div className="bg-emerald-500" style={{ width: '45%' }} />
                                    <div className="bg-amber-500" style={{ width: '30%' }} />
                                    <div className="bg-rose-500" style={{ width: '15%' }} />
                                    <div className="bg-slate-900" style={{ width: '10%' }} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-tight">Low: 45%</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-tight">Mid: 30%</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-rose-500" />
                                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-tight">High: 15%</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-slate-900" />
                                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-tight">Crit: 10%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100">
                                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-3">Critical Alerts</h4>
                                <div className="space-y-3">
                                    <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100 flex items-start gap-3">
                                        <AlertTriangle size={14} className="text-rose-600 mt-0.5" />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-rose-900 uppercase tracking-tight">3 Suspended Entities</span>
                                            <span className="text-[9px] text-rose-600 font-bold leading-tight">Requires manual reconciliation of outstanding balances.</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </DataCard>

                    <DataCard title="Alpha Performers" icon={<TrendingUp size={18} />}>
                        <div className="space-y-4">
                            {borrowers.slice(0, 3).map((b, i) => (
                                <div key={i} className="flex items-center justify-between group cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center font-black text-[10px] text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                                            {b.name.charAt(0)}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{b.name}</span>
                                            <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-widest">{b.creditScore} Alpha</span>
                                        </div>
                                    </div>
                                    <div className="text-[10px] font-black text-slate-900">{formatCurrency(b.totalBorrowed)}</div>
                                </div>
                            ))}
                        </div>
                    </DataCard>
                </div>
            </div>
        </div>
    );
};

export default BorrowersEnlite;

const TrendingUp: React.FC<{ size?: number; className?: string }> = ({ size = 24, className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
    </svg>
);

const AlertTriangle: React.FC<{ size?: number; className?: string }> = ({ size = 24, className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
    </svg>
);
