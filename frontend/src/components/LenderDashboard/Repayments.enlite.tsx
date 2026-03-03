import React from 'react';
import {
    Clock,
    DollarSign,
    CheckCircle,
    AlertTriangle,
    Eye,
    MessageSquare,
    CreditCard,
    FileText,
    Calendar,
    Download,
    User,
    Truck,
    TrendingUp,
    Percent
} from 'lucide-react';
import StatCard from '../EnliteUI/Cards/StatCard';
import DataCard from '../EnliteUI/Cards/DataCard';
import EnhancedTable from '../EnliteUI/Tables/EnhancedTable';

interface Payment {
    id: string;
    loanId: string;
    borrowerName: string;
    borrowerEmail: string;
    borrowerPhone: string;
    principalAmount: number;
    interestAmount: number;
    totalAmount: number;
    dueDate: string;
    paidDate?: string;
    status: 'pending' | 'paid' | 'overdue' | 'partial' | 'failed';
    paymentMethod?: 'bank_transfer' | 'ach' | 'wire' | 'check' | 'online';
    cargoType: string;
    route: {
        origin: string;
        destination: string;
    };
    loanAmount: number;
    remainingBalance: number;
    paymentNumber: number;
    totalPayments: number;
    daysOverdue?: number;
    lateFee?: number;
    partialAmount?: number;
    transactionId?: string;
    notes?: string;
    contactAttempts: number;
    lastContactDate?: string;
    autoPayEnabled: boolean;
    riskLevel: 'low' | 'medium' | 'high';
}

interface RepaymentsEnliteProps {
    loading: boolean;
    payments: Payment[];
    analytics: {
        total: number;
        pending: number;
        overdue: number;
        paid: number;
        totalAmount: number;
        paidAmount: number;
        overdueAmount: number;
        collectionRate: number;
        avgDaysOverdue: number;
    };
    onSort: (key: string) => void;
    sortKey: string;
    sortDirection: 'asc' | 'desc';
    onViewDetails: (payment: Payment) => void;
    onContactBorrower: (payment: Payment) => void;
    onRecordPayment: (payment: Payment) => void;
    onExport: () => void;
}

const RepaymentsEnlite: React.FC<RepaymentsEnliteProps> = ({
    loading,
    payments,
    analytics,
    onSort,
    sortKey,
    sortDirection,
    onViewDetails,
    onContactBorrower,
    onRecordPayment,
    onExport
}) => {

    const columns = [
        {
            key: 'id',
            label: 'Payment Identity',
            sortable: true,
            render: (id: string, row: Payment) => (
                <div className="flex flex-col gap-1">
                    <span className="text-sm font-black text-slate-900 tracking-tight leading-tight uppercase">{id}</span>
                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{row.loanId}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-200" />
                        <span className="text-[10px] font-black text-[#345E85] uppercase tracking-widest leading-none">P{row.paymentNumber}/{row.totalPayments}</span>
                    </div>
                </div>
            )
        },
        {
            key: 'borrowerName',
            label: 'Borrower',
            sortable: true,
            render: (name: string, row: Payment) => (
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 group-hover:bg-blue-50 group-hover:text-[#345E85] transition-colors">
                        <User className="w-4 h-4" />
                    </div>
                    <div>
                        <div className="text-sm font-black text-slate-900 tracking-tight leading-tight uppercase">{name}</div>
                        <div className="flex items-center gap-1.5 mt-1">
                            <Truck className="w-3 h-3 text-slate-400" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[120px]">{row.cargoType}</span>
                        </div>
                    </div>
                </div>
            )
        },
        {
            key: 'totalAmount',
            label: 'Fiscal Yield',
            sortable: true,
            render: (amount: number, row: Payment) => (
                <div className="flex flex-col gap-1">
                    <span className="text-sm font-black text-slate-900 tracking-tight leading-tight uppercase">
                        ${amount.toLocaleString()}
                    </span>
                    <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none">P: ${row.principalAmount.toLocaleString()}</span>
                        {row.lateFee && row.lateFee > 0 && (
                            <>
                                <span className="w-1 h-1 rounded-full bg-rose-200" />
                                <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest leading-none">FEE: ${row.lateFee.toLocaleString()}</span>
                            </>
                        )}
                    </div>
                </div>
            )
        },
        {
            key: 'dueDate',
            label: 'Timestamp',
            sortable: true,
            render: (date: string, row: Payment) => {
                const isOverdue = row.status === 'overdue' || (row.status === 'pending' && new Date(date) < new Date());
                return (
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                            <Calendar className={`w-3.5 h-3.5 ${isOverdue ? 'text-rose-500' : 'text-slate-400'}`} />
                            <span className={`text-[10px] font-black uppercase tracking-widest leading-none ${isOverdue ? 'text-rose-600' : 'text-slate-600'}`}>
                                {new Date(date).toLocaleDateString()}
                            </span>
                        </div>
                        {isOverdue && row.daysOverdue && (
                            <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest leading-none">
                                {row.daysOverdue}D OVERDUE
                            </span>
                        )}
                        {row.paidDate && (
                            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none">
                                SYNCED: {new Date(row.paidDate).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                );
            }
        },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            render: (status: string) => {
                const iconMap: Record<string, any> = {
                    pending: <Clock className="w-2.5 h-2.5" />,
                    paid: <CheckCircle className="w-2.5 h-2.5" />,
                    overdue: <AlertTriangle className="w-2.5 h-2.5" />,
                    partial: <Percent className="w-2.5 h-2.5" />,
                    failed: <AlertTriangle className="w-2.5 h-2.5" />
                };

                const colorMap: Record<string, string> = {
                    pending: 'bg-amber-50 text-amber-600 border-amber-100',
                    paid: 'bg-emerald-50 text-emerald-600 border-emerald-100',
                    overdue: 'bg-rose-50 text-rose-600 border-rose-100',
                    partial: 'bg-blue-50 text-[#345E85] border-blue-100',
                    failed: 'bg-rose-50 text-rose-600 border-rose-100'
                };

                return (
                    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-widest ${colorMap[status] || 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                        {iconMap[status] || <FileText className="w-2.5 h-2.5" />}
                        {status}
                    </div>
                );
            }
        },
        {
            key: 'riskLevel',
            label: 'Risk Index',
            sortable: true,
            render: (risk: string) => {
                const colorMap: Record<string, string> = {
                    low: 'bg-emerald-50 text-emerald-600 border-emerald-100',
                    medium: 'bg-amber-50 text-amber-600 border-amber-100',
                    high: 'bg-rose-50 text-rose-600 border-rose-100'
                };
                return (
                    <div className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter border ${colorMap[risk] || 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                        {risk}
                    </div>
                );
            }
        },
        {
            key: 'actions',
            label: 'Operation',
            render: (_: any, row: Payment) => (
                <div className="flex items-center justify-center gap-1.5">
                    <button
                        onClick={() => onViewDetails(row)}
                        className="p-1.5 text-slate-400 hover:text-[#345E85] hover:bg-blue-50 rounded-lg transition-all border border-transparent hover:border-blue-100 shadow-sm hover:shadow-blue-100/50"
                        title="Audit Log"
                    >
                        <Eye className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onContactBorrower(row)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all border border-transparent hover:border-emerald-100 shadow-sm hover:shadow-emerald-100/50"
                        title="Communicate"
                    >
                        <MessageSquare className="w-4 h-4" />
                    </button>
                    {row.status !== 'paid' && (
                        <button
                            onClick={() => onRecordPayment(row)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all border border-transparent hover:border-amber-100 shadow-sm hover:shadow-amber-100/50"
                            title="Settle Clearance"
                        >
                            <CreditCard className="w-4 h-4" />
                        </button>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="space-y-8">
            {/* Fiscal Intelligence Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Yield Index"
                    value={analytics.total}
                    icon={<FileText />}
                    subtitle={`Exp: $${analytics.totalAmount.toLocaleString()}`}
                    color="primary"
                    loading={loading}
                />
                <StatCard
                    title="Clearance Priority"
                    value={analytics.overdue}
                    icon={<AlertTriangle />}
                    subtitle={`Amt: $${analytics.overdueAmount.toLocaleString()}`}
                    trend={`${analytics.avgDaysOverdue}D Avg`}
                    trendDirection="neutral"
                    color="error"
                    loading={loading}
                />
                <StatCard
                    title="Collection Velocity"
                    value={`${analytics.collectionRate}%`}
                    icon={<Percent />}
                    subtitle="Lifetime throughput"
                    trend="+3.2%"
                    trendDirection="up"
                    color="success"
                    loading={loading}
                />
                <StatCard
                    title="Liquid Capital"
                    value={`$${analytics.paidAmount.toLocaleString()}`}
                    icon={<DollarSign />}
                    subtitle="Settled assets"
                    color="info"
                    loading={loading}
                />
            </div>

            {/* Repayment Management Hub */}
            <DataCard
                title="Fiscal Clearance Workflow"
                subtitle="MONITOR REPAYMENT SCHEDULES AND AUDIT COLLECTION ACTIVITIES"
                icon={<TrendingUp className="w-5 h-5" />}
                headerColor="primary"
                actions={
                    <button
                        onClick={onExport}
                        className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all backdrop-blur-sm border border-white/10 flex items-center gap-2"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Export Audit
                    </button>
                }
            >
                <EnhancedTable
                    columns={columns}
                    data={payments}
                    loading={loading}
                    onSort={onSort}
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    striped
                    hoverable
                    emptyMessage="No fiscal transactions identified under current filters"
                />
            </DataCard>
        </div>
    );
};

export default RepaymentsEnlite;
