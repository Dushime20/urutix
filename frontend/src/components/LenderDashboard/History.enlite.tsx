import React from 'react';
import {
    ArrowUpRight,
    ArrowDownLeft,
    Search,
    Filter,
    Calendar,
    Download,
    Eye,
    Printer,
    FileText,
    CreditCard,
    Building2,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    MoreVertical
} from 'lucide-react';
import StatCard from '../EnliteUI/Cards/StatCard';
import DataCard from '../EnliteUI/Cards/DataCard';
import EnhancedTable from '../EnliteUI/Tables/EnhancedTable';

export interface Transaction {
    id: string;
    date: string;
    type: 'loan_disbursement' | 'loan_repayment' | 'interest_payment' | 'fee_collection' | 'penalty' | 'refund';
    amount: number;
    status: 'completed' | 'pending' | 'failed' | 'cancelled';
    borrowerName: string;
    borrowerBusiness: string;
    loanId: string;
    description: string;
    reference: string;
    method: 'bank_transfer' | 'wire' | 'ach' | 'check' | 'cash';
    category: 'lending' | 'collections' | 'fees' | 'other';
    balanceBefore: number;
    balanceAfter: number;
    notes?: string;
}

interface HistoryEnliteProps {
    loading: boolean;
    transactions: Transaction[];
    stats: {
        totalTransactions: number;
        totalAmount: number;
        moneyIn: number;
        moneyOut: number;
    };
    onViewDetails: (txn: Transaction) => void;
    onDownloadReceipt: (txn: Transaction) => void;
    onPrint: (txn: Transaction) => void;
    onExport: () => void;
}

const HistoryEnlite: React.FC<HistoryEnliteProps> = ({
    loading,
    transactions,
    stats,
    onViewDetails,
    onDownloadReceipt,
    onPrint,
    onExport
}) => {
    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'failed': return 'bg-rose-50 text-rose-700 border-rose-200';
            case 'cancelled': return 'bg-slate-50 text-slate-700 border-slate-200';
            default: return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckCircle2 size={12} className="mr-1" />;
            case 'pending': return <Clock size={12} className="mr-1" />;
            case 'failed': return <XCircle size={12} className="mr-1" />;
            case 'cancelled': return <AlertCircle size={12} className="mr-1" />;
            default: return null;
        }
    };

    const getTypeStyle = (type: string) => {
        switch (type) {
            case 'loan_repayment':
            case 'interest_payment':
            case 'fee_collection':
            case 'penalty':
                return 'text-emerald-600 bg-emerald-50/50';
            case 'loan_disbursement':
                return 'text-rose-600 bg-rose-50/50';
            default:
                return 'text-slate-600 bg-slate-50';
        }
    };

    const getTypeIcon = (type: string) => {
        if (type === 'loan_disbursement') return <ArrowUpRight size={14} />;
        return <ArrowDownLeft size={14} />;
    };

    const columns = [
        {
            key: 'date',
            label: 'TIMESTAMP',
            render: (_: any, txn: Transaction) => (
                <div className="flex flex-col">
                    <span className="font-black text-slate-900 text-[11px] uppercase tracking-tight">
                        {new Date(txn.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                        {new Date(txn.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            ),
            sortable: true
        },
        {
            key: 'type',
            label: 'TRANSACTION TYPE',
            render: (_: any, txn: Transaction) => (
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl border border-transparent ${getTypeStyle(txn.type)}`}>
                        {getTypeIcon(txn.type)}
                    </div>
                    <div className="flex flex-col">
                        <span className="font-black text-slate-900 uppercase tracking-tighter text-[11px]">
                            {txn.type.replace('_', ' ')}
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">
                            Ref: {txn.reference}
                        </span>
                    </div>
                </div>
            ),
            sortable: true
        },
        {
            key: 'borrower',
            label: 'PARTY INVOLVED',
            render: (_: any, txn: Transaction) => (
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-black shadow-lg shadow-slate-200">
                        {txn.borrowerName.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                        <span className="font-black text-slate-900 uppercase tracking-tight text-[11px]">{txn.borrowerName}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1 group">
                            <Building2 size={10} className="group-hover:text-[#345E85] transition-colors" /> {txn.borrowerBusiness}
                        </span>
                    </div>
                </div>
            )
        },
        {
            key: 'amount',
            label: 'FISCAL IMPACT',
            render: (_: any, txn: Transaction) => (
                <div className="flex flex-col text-right pr-4">
                    <span className={`font-black text-[11px] ${txn.amount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {txn.amount > 0 ? '+' : ''}RWF {Math.abs(txn.amount).toLocaleString()}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                        Method: {txn.method.replace('_', ' ')}
                    </span>
                </div>
            ),
            sortable: true
        },
        {
            key: 'status',
            label: 'SETTLEMENT STATE',
            render: (_: any, txn: Transaction) => (
                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border transition-all ${getStatusStyle(txn.status)}`}>
                    {getStatusIcon(txn.status)}
                    {txn.status}
                </span>
            ),
            sortable: true
        },
        {
            key: 'actions',
            label: '',
            render: (_: any, txn: Transaction) => (
                <div className="flex justify-end gap-1.5 opacity-0 group-hover/row:opacity-100 transition-all">
                    <button
                        onClick={() => onViewDetails(txn)}
                        className="p-2 text-slate-400 hover:text-[#345E85] hover:bg-blue-50 rounded-xl transition-all"
                        title="Snapshot View"
                    >
                        <Eye size={14} />
                    </button>
                    <button
                        onClick={() => onDownloadReceipt(txn)}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                        title="Download Ledger"
                    >
                        <Download size={14} />
                    </button>
                    <button
                        onClick={() => onPrint(txn)}
                        className="p-2 text-slate-400 hover:text-[#345E85] hover:bg-blue-50 rounded-xl transition-all"
                        title="Print Record"
                    >
                        <Printer size={14} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Transaction Insight Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Events"
                    value={stats.totalTransactions}
                    subtitle="Processed Records"
                    icon={<FileText size={24} />}
                    color="primary"
                />
                <StatCard
                    title="Yield Inflow"
                    value={`RWF ${(stats.moneyIn / 1000000).toFixed(1)}M`}
                    trend="+12% from last month"
                    trendDirection="up"
                    icon={<ArrowDownLeft size={24} />}
                    color="success"
                />
                <StatCard
                    title="Capital Outflow"
                    value={`RWF ${(stats.moneyOut / 1000000).toFixed(1)}M`}
                    trend="-5% from last month"
                    trendDirection="down"
                    icon={<ArrowUpRight size={24} />}
                    color="secondary"
                />
                <StatCard
                    title="Network Volume"
                    value={`RWF ${(stats.totalAmount / 1000000).toFixed(1)}M`}
                    subtitle="Aggregate Throughput"
                    icon={<CreditCard size={24} />}
                    color="warning"
                />
            </div>

            {/* Main Ledger Console */}
            <DataCard
                title="Institutional Ledger"
                subtitle="Detailed audit trail of all financial movements"
                actions={
                    <div className="flex items-center gap-3">
                        <div className="hidden md:flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                            <button className="px-3 py-1.5 bg-white text-[#345E85] rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">Real-time</button>
                            <button className="px-3 py-1.5 text-slate-500 hover:text-slate-700 text-[10px] font-black uppercase tracking-widest">Archival</button>
                        </div>
                        <button
                            onClick={onExport}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-200 transition-all active:scale-95"
                        >
                            <Download size={14} /> Export Scheme
                        </button>
                    </div>
                }
            >
                <EnhancedTable
                    columns={columns}
                    data={transactions}
                    loading={loading}
                    emptyMessage="No historical footprint found within selected parameters"
                    rowClassName={() => 'group/row'}
                />
            </DataCard>

            {/* Modern Filter Strip */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[200px] relative group">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-300 group-hover:text-[#345E85] transition-colors" size={16} />
                    <input
                        type="text"
                        placeholder="Search by ID, Borrower, or Reference..."
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-transparent rounded-xl text-[11px] font-bold text-slate-700 focus:bg-white focus:border-blue-100 focus:ring-4 focus:ring-blue-50/50 transition-all placeholder:text-slate-300 outline-none"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-10 w-10 bg-slate-50 flex items-center justify-center rounded-xl text-slate-400 hover:bg-blue-50 hover:text-[#345E85] transition-all cursor-pointer">
                        <Filter size={18} />
                    </div>
                    <div className="h-10 w-10 bg-slate-50 flex items-center justify-center rounded-xl text-slate-400 hover:bg-blue-50 hover:text-[#345E85] transition-all cursor-pointer">
                        <Calendar size={18} />
                    </div>
                    <div className="h-10 w-10 bg-slate-50 flex items-center justify-center rounded-xl text-slate-400 hover:bg-blue-50 hover:text-[#345E85] transition-all cursor-pointer">
                        <MoreVertical size={18} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HistoryEnlite;
