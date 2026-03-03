import React from 'react';
import {
    Clock,
    DollarSign,
    CheckCircle,
    AlertTriangle,
    Eye,
    Check,
    X,
    Download,
    Building,
    ArrowUpRight,
    Shield,
    CreditCard,
    FileText
} from 'lucide-react';
import StatCard from '../EnliteUI/Cards/StatCard';
import DataCard from '../EnliteUI/Cards/DataCard';
import EnhancedTable from '../EnliteUI/Tables/EnhancedTable';

interface LoanRequestsEnliteProps {
    loading: boolean;
    requests: any[];
    analytics: any;
    onApprove: (id: string, amount: number, rate: number) => void;
    onReject: (id: string, reason: string) => void;
    onViewDetails: (request: any) => void;
    onProcessPayment: (request: any) => void;
    onViewPaymentDetails: (request: any) => void;
    onExport: () => void;
}

const LoanRequestsEnlite: React.FC<LoanRequestsEnliteProps> = ({
    loading,
    requests,
    analytics,
    onApprove,
    onReject,
    onViewDetails,
    onProcessPayment,
    onViewPaymentDetails,
    onExport
}) => {


    const columns = [
        {
            key: 'borrower_name',
            label: 'Borrower',
            sortable: true,
            render: (name: string, row: any) => (
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs ring-2 ring-white shadow-sm border border-slate-200">
                        {name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-slate-900 text-sm truncate">{name}</p>
                        {row.borrower_company && (
                            <p className="text-[10px] text-slate-500 flex items-center gap-1 uppercase tracking-wider font-medium">
                                <Building className="w-2.5 h-2.5" />
                                {row.borrower_company}
                            </p>
                        )}
                    </div>
                </div>
            )
        },
        {
            key: 'requested_amount',
            label: 'Financing',
            sortable: true,
            render: (amount: number, row: any) => (
                <div className="space-y-1">
                    <p className="font-bold text-slate-900 text-sm">RWF {(amount / 1000000).toFixed(1)}M</p>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-bold border border-blue-100 italic">
                            {row.interest_rate}% APR
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                            {row.loan_term_months}m
                        </span>
                    </div>
                </div>
            )
        },
        {
            key: 'cargo_type',
            label: 'Cargo & Route',
            sortable: true,
            render: (type: string, row: any) => (
                <div className="min-w-[180px]">
                    <p className="text-xs font-semibold text-slate-800">{type} ({row.cargo_weight}kg)</p>
                    <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                        <span className="font-bold text-blue-600">{row.pickup_location.split(',')[0]}</span>
                        <ArrowUpRight className="w-2 h-2" />
                        <span className="font-bold text-blue-800">{row.delivery_location.split(',')[0]}</span>
                    </p>
                </div>
            )
        },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            render: (status: string) => {
                const iconMap: Record<string, any> = {
                    pending: <Clock className="w-2.5 h-2.5" />,
                    approved: <CheckCircle className="w-2.5 h-2.5" />,
                    disbursed: <DollarSign className="w-2.5 h-2.5" />,
                    rejected: <X className="w-2.5 h-2.5" />,
                    repaid: <CheckCircle className="w-2.5 h-2.5" />,
                    overdue: <AlertTriangle className="w-2.5 h-2.5" />
                };

                return (
                    <div className="flex flex-col gap-1.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border
              ${status.toLowerCase() === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                status.toLowerCase() === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                    status.toLowerCase() === 'disbursed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                        status.toLowerCase() === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                            status.toLowerCase() === 'repaid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                status.toLowerCase() === 'overdue' ? 'bg-rose-100 text-rose-700 border-rose-200' :
                                                    'bg-slate-50 text-slate-700 border-slate-200'}`}
                        >
                            {iconMap[status.toLowerCase()] || <FileText className="w-2.5 h-2.5" />}
                            {status}
                        </span>
                    </div>
                );
            }
        },
        {
            key: 'risk_score',
            label: 'Risk',
            sortable: true,
            render: (score: number) => (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-[60px]">
                            <div
                                className={`h-full rounded-full ${score >= 80 ? 'bg-[#345E85]' : score >= 60 ? 'bg-[#5F8FB3]' : 'bg-slate-300'}`}
                                style={{ width: `${score}%` }}
                            />
                        </div>
                        <span className={`text-xs font-black ${score >= 80 ? 'text-[#345E85]' : score >= 60 ? 'text-[#5F8FB3]' : 'text-slate-500'}`}>
                            {score}%
                        </span>
                    </div>
                    <span className="text-[9px] text-slate-400 uppercase font-black">Score Index</span>
                </div>
            )
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (_: any, row: any) => (
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => onViewDetails(row)}
                        className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-navy-600 transition-colors"
                        title="View Details"
                    >
                        <Eye className="w-4 h-4" />
                    </button>

                    {row.status === 'pending' && (
                        <>
                            <button
                                onClick={() => onApprove(row.id, row.requested_amount, row.interest_rate || 10)}
                                className="p-1.5 hover:bg-blue-50 rounded text-blue-600 transition-colors"
                                title="Approve"
                            >
                                <Check className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => {
                                    const reason = prompt('Enter rejection reason:') || 'Application did not meet criteria';
                                    if (reason) onReject(row.id, reason);
                                }}
                                className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors"
                                title="Reject"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </>
                    )}

                    {row.status === 'approved' && (
                        <button
                            onClick={() => onProcessPayment(row)}
                            className="p-1.5 hover:bg-blue-50 rounded text-blue-600 transition-colors"
                            title="Disburse Funds"
                        >
                            <DollarSign className="w-4 h-4" />
                        </button>
                    )}

                    {row.status === 'disbursed' && (
                        <button
                            onClick={() => onViewPaymentDetails(row)}
                            className="p-1.5 hover:bg-blue-50 rounded text-blue-600 transition-colors"
                            title="Payment Details"
                        >
                            <CreditCard className="w-4 h-4" />
                        </button>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            {/* Analytics Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Applications"
                    value={analytics?.totalRequests || 0}
                    icon={<FileText />}
                    trend={`${analytics?.monthlyGrowth || 0}%`}
                    trendDirection="up"
                    color="primary"
                    subtitle="Lifetime requests"
                    loading={loading}
                />
                <StatCard
                    title="Pending Approval"
                    value={analytics?.pendingRequests || 0}
                    icon={<Clock />}
                    color="secondary"
                    subtitle="Requires attention"
                    loading={loading}
                />
                <StatCard
                    title="Capital Requested"
                    value={`RWF ${(analytics?.totalAmountRequested / 1000000 || 0).toFixed(1)}M`}
                    icon={<DollarSign />}
                    color="info"
                    subtitle="Pipeline volume"
                    loading={loading}
                />
                <StatCard
                    title="Approval Strategy"
                    value={`${analytics?.approvalRate?.toFixed(1) || 0}%`}
                    icon={<Shield />}
                    color="accent"
                    subtitle={`Avg risk: ${analytics?.averageRiskScore?.toFixed(0) || 0}%`}
                    loading={loading}
                />
            </div>

            {/* Requests Management */}
            <DataCard
                title="Loan Workflow Management"
                icon={<Activity className="w-5 h-5" />}
                headerColor="primary"
                actions={
                    <button
                        onClick={onExport}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-md text-xs font-bold transition-colors"
                    >
                        <Download className="w-3.5 h-3.5" />
                        EXPORT DATA
                    </button>
                }
            >
                <EnhancedTable
                    columns={columns}
                    data={requests}
                    loading={loading}
                    striped
                    hoverable
                    emptyMessage="No loan requests match your current filters"
                />
            </DataCard>
        </div>
    );
};

// Internal Activity Icon since lucide was missing it in the prompt imports check, although usually available
const Activity = (props: any) => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
);

export default LoanRequestsEnlite;
