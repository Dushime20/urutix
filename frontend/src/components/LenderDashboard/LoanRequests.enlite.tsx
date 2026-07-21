import React, { useState } from 'react';
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
    FileText,
    Activity,
    Send,
    Hourglass,
} from 'lucide-react';
import DataCard from '../EnliteUI/Cards/DataCard';
import EnhancedTable from '../EnliteUI/Tables/EnhancedTable';
import { StatCard } from '../EnliteUI';
import ExportModal from '../ExportModal/ExportModal';
import { prepareLoanRequestsForExport } from '../../utils/exportUtils';
import LoanApprovalModal from './LoanApprovalModal';
import { TranslatedText } from '../translated-text';
import { useTranslation } from '../../hooks/useTranslation';
import LoanDisbursementModal from './LoanDisbursementModal';
import type { LoanApprovalPayload } from './LoanApprovalModal';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';

interface LoanRequestsEnliteProps {
    loading: boolean;
    requests: any[];
    analytics: any;
    onApprove: (id: string, payload: LoanApprovalPayload) => Promise<void>;
    onReject: (id: string, reason: string) => void;
    onViewDetails: (request: any) => void;
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
    onViewPaymentDetails,
    onExport
}) => {
    const { format: formatAmount, compact: compactAmount } = useCurrencyFormat();
    const { tSync: t } = useTranslation();
    const [showExportModal, setShowExportModal] = useState(false);
    const [approvalLoan, setApprovalLoan] = useState<any | null>(null);
    const [disburseLoan, setDisburseLoan] = useState<any | null>(null);

    const handleExport = () => {
        setShowExportModal(true);
    };

    const handleExportComplete = () => {
        setShowExportModal(false);
        if (onExport) onExport();
    };


    const columns = [
        {
            key: 'borrower_name',
            label: t('Borrower'),
            sortable: true,
            render: (name: string, row: any) => (
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold text-xs ring-2 ring-white dark:ring-slate-700 shadow-sm border border-slate-200 dark:border-slate-700">
                        {name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{name}</p>
                        {row.borrower_company && (
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 uppercase tracking-wider font-medium">
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
            label: t('Financing'),
            sortable: true,
            render: (amount: number, row: any) => (
                <div className="space-y-1">
                    <p className="font-bold text-slate-900 dark:text-white text-sm">{formatAmount(amount)}</p>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded font-bold border border-blue-100 dark:border-blue-800/50 italic">
                            {row.interest_rate}% APR
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                            {row.loan_term_months}m
                        </span>
                    </div>
                </div>
            )
        },
        {
            key: 'cargo_type',
            label: t('Cargo & Route'),
            sortable: true,
            render: (type: string, row: any) => (
                <div className="min-w-[180px]">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{type} ({row.cargo_weight}kg)</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                        <span className="font-bold text-blue-600 dark:text-blue-400">{row.pickup_location.split(',')[0]}</span>
                        <ArrowUpRight className="w-2 h-2" />
                        <span className="font-bold text-blue-800 dark:text-blue-300">{row.delivery_location.split(',')[0]}</span>
                    </p>
                </div>
            )
        },
        {
            key: 'status',
            label: t('Status'),
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
              ${status.toLowerCase() === 'pending' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50' :
                                status.toLowerCase() === 'approved' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50' :
                                    status.toLowerCase() === 'disbursed' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/50' :
                                        status.toLowerCase() === 'rejected' ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/50' :
                                            status.toLowerCase() === 'repaid' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50' :
                                                status.toLowerCase() === 'overdue' ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/50' :
                                                    'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}
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
            label: t('Risk'),
            sortable: true,
            render: (score: number) => (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                        <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden max-w-[60px]">
                            <div
                                className={`h-full rounded-full ${score >= 80 ? 'bg-[#345E85] dark:bg-blue-500' : score >= 60 ? 'bg-[#5F8FB3] dark:bg-blue-400' : 'bg-slate-300 dark:bg-slate-600'}`}
                                style={{ width: `${score}%` }}
                            />
                        </div>
                        <span className={`text-xs font-black ${score >= 80 ? 'text-[#345E85] dark:text-blue-400' : score >= 60 ? 'text-[#5F8FB3] dark:text-blue-300' : 'text-slate-500 dark:text-slate-400'}`}>
                            {score}%
                        </span>
                    </div>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-black">Score Index</span>
                </div>
            )
        },
        {
            key: 'actions',
            label: t('Actions'),
            render: (_: any, row: any) => (
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => onViewDetails(row)}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 dark:text-slate-400 hover:text-navy-600 dark:hover:text-blue-400 transition-colors"
                        title="View Details"
                    >
                        <Eye className="w-4 h-4" />
                    </button>

                    {row.status === 'pending' && (
                        <>
                            <button
                                onClick={() => setApprovalLoan(row)}
                                className="p-1.5 hover:bg-[#2c5173]/10 rounded text-[#2c5173] transition-colors"
                                title="Prepare Offer"
                            >
                                <Check className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => {
                                    const reason = prompt('Enter rejection reason:') || 'Application did not meet criteria';
                                    if (reason) onReject(row.id, reason);
                                }}
                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400 transition-colors"
                                title="Reject"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </>
                    )}

                    {row.status === 'approved' && !row.borrower_accepted_at && (
                        <span
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 text-amber-700 text-[9px] font-black uppercase tracking-wider"
                            title="Waiting for borrower to accept terms"
                        >
                            <Hourglass className="w-3 h-3" /> Awaiting Acceptance
                        </span>
                    )}

                    {row.status === 'approved' && row.borrower_accepted_at && (
                        <button
                            onClick={() => setDisburseLoan(row)}
                            className="p-1.5 hover:bg-emerald-100 rounded text-emerald-700 transition-colors"
                            title="Disburse Funds"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    )}

                    {row.status === 'disbursed' && (
                        <button
                            onClick={() => onViewPaymentDetails(row)}
                            className="p-1.5 hover:bg-[#2c5173]/10 rounded text-[#2c5173] transition-colors"
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
        <div className="space-y-12">
            {/* Analytics Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title={t("Total Applications")} value={analytics?.totalRequests ?? 0} subtitle={t("Lifetime requests")} icon={<FileText size={18} />} color="primary" variant="classic" />
                <StatCard title={t("Pending Approval")} value={analytics?.pendingRequests ?? 0} subtitle={t("Requires attention")} icon={<Clock size={18} />} color="primary" variant="classic" />
                <StatCard title={t("Capital Requested")} value={compactAmount(analytics?.totalAmountRequested || 0)} subtitle={t("Pipeline volume")} icon={<DollarSign size={18} />} color="primary" variant="classic" />
                <StatCard title={t("Approval Rate")} value={`${analytics?.approvalRate?.toFixed(1) || 0}%`} subtitle={`${t("Avg risk")}: ${analytics?.averageRiskScore?.toFixed(0) || 0}%`} icon={<Shield size={18} />} color="primary" variant="classic" />
            </div>

            {/* Requests Management */}
            <DataCard
                title={t("Loan Workflow Management")}
                icon={<Activity className="w-5 h-5" />}
                headerColor="primary"
                actions={
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-md text-xs font-bold transition-colors"
                    >
                        <Download className="w-3.5 h-3.5" />
                        <TranslatedText text="EXPORT DATA" />
                    </button>
                }
            >
                <EnhancedTable
                    columns={columns}
                    data={requests}
                    loading={loading}
                    striped
                    hoverable
                    emptyMessage={t("No loan requests match your current filters")}
                />
            </DataCard>

            {/* Export Modal */}
            <ExportModal
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
                data={requests}
                filename="loan_requests"
                prepareData={prepareLoanRequestsForExport}
                title="Export Loan Requests"
            />

            {approvalLoan && (
                <LoanApprovalModal
                    loan={approvalLoan}
                    onClose={() => setApprovalLoan(null)}
                    onConfirm={async () => { /* handled internally by modal */ }}
                    onSuccess={(loanId) => {
                        setApprovalLoan(null);
                        onApprove(loanId, { approvedAmount: approvalLoan.approved_amount ?? approvalLoan.requested_amount, loanTermMonths: approvalLoan.loan_term_months ?? 3, dueDate: approvalLoan.due_date ?? '' });
                    }}
                />
            )}

            {disburseLoan && (
                <LoanDisbursementModal
                    loan={disburseLoan}
                    onClose={() => setDisburseLoan(null)}
                    onSuccess={() => {
                        setDisburseLoan(null);
                        onApprove(disburseLoan.id, { approvedAmount: disburseLoan.approved_amount, loanTermMonths: disburseLoan.loan_term_months ?? 3, dueDate: disburseLoan.due_date ?? '' });
                    }}
                />
            )}
        </div>
    );
};

export default LoanRequestsEnlite;
