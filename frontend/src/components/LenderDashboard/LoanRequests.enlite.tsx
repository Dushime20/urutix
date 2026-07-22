import React, { useState, useEffect } from 'react';
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
import LoanRejectModal from './LoanRejectModal';
import { TranslatedText } from '../translated-text';
import { useTranslation } from '../../hooks/useTranslation';
import LoanDisbursementModal from './LoanDisbursementModal';
import type { LoanApprovalPayload } from './LoanApprovalModal';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
import {
    buildLoanWorkflowView,
    workflowStageBadgeClass,
    type LoanWorkflowStage,
} from '../../utils/loanWorkflow';

interface LoanRequestsEnliteProps {
    loading: boolean;
    requests: any[];
    analytics: any;
    onApprove: (id: string, payload: LoanApprovalPayload) => Promise<void>;
    onReject: (id: string, reason: string) => void;
    onViewDetails: (request: any) => void;
    onViewPaymentDetails: (request: any) => void;
    onExport: () => void;
    /** When set (e.g. from ?loan=&action=disburse), auto-open the pay modal */
    autoDisburseLoanId?: string | null;
}

const LoanRequestsEnlite: React.FC<LoanRequestsEnliteProps> = ({
    loading,
    requests,
    analytics,
    onApprove,
    onReject,
    onViewDetails,
    onViewPaymentDetails,
    onExport,
    autoDisburseLoanId,
}) => {
    const { format: formatAmount, compact: compactAmount } = useCurrencyFormat();
    const { tSync: t } = useTranslation();
    const [showExportModal, setShowExportModal] = useState(false);
    const [approvalLoan, setApprovalLoan] = useState<any | null>(null);
    const [rejectLoan, setRejectLoan] = useState<any | null>(null);
    const [disburseLoan, setDisburseLoan] = useState<any | null>(null);

    useEffect(() => {
        if (!autoDisburseLoanId || !requests?.length) return;
        const loan = requests.find((r) => r.id === autoDisburseLoanId);
        if (!loan) return;
        const wf = buildLoanWorkflowView(loan);
        if (wf.ready_to_disburse) {
            setDisburseLoan(loan);
        } else if (wf.workflow_stage === 'pending_review' || wf.workflow_stage === 'appeal_pending') {
            setApprovalLoan(loan);
        }
    }, [autoDisburseLoanId, requests]);

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
            render: (amount: number, row: any) => {
                const wf = buildLoanWorkflowView(row);
                const offered = row.approved_amount != null ? Number(row.approved_amount) : null;
                const showOffered = offered != null && (
                    wf.awaiting_borrower_response || wf.ready_to_disburse || row.status === 'disbursed'
                );
                return (
                    <div className="space-y-1">
                        {showOffered ? (
                            <>
                                <p className="font-bold text-slate-900 dark:text-white text-sm">
                                    {formatAmount(offered)}
                                </p>
                                {wf.is_partial_offer && (
                                    <p className="text-[10px] text-orange-600 dark:text-orange-400 font-semibold">
                                        of {formatAmount(amount)} requested
                                    </p>
                                )}
                            </>
                        ) : (
                            <p className="font-bold text-slate-900 dark:text-white text-sm">{formatAmount(amount)}</p>
                        )}
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded font-bold border border-blue-100 dark:border-blue-800/50 italic">
                                {row.interest_rate != null ? `${row.interest_rate}% APR` : '% APR'}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                {row.loan_term_months || '—'}m
                            </span>
                        </div>
                    </div>
                );
            }
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
            render: (_status: string, row: any) => {
                const wf = buildLoanWorkflowView(row);
                const stage = wf.workflow_stage as LoanWorkflowStage;
                const iconMap: Partial<Record<LoanWorkflowStage, React.ReactNode>> = {
                    pending_review: <Clock className="w-2.5 h-2.5" />,
                    appeal_pending: <Hourglass className="w-2.5 h-2.5" />,
                    offer_sent: <Send className="w-2.5 h-2.5" />,
                    counter_offer_sent: <Hourglass className="w-2.5 h-2.5" />,
                    ready_to_disburse: <CheckCircle className="w-2.5 h-2.5" />,
                    disbursed: <DollarSign className="w-2.5 h-2.5" />,
                    rejected: <X className="w-2.5 h-2.5" />,
                    repaid: <CheckCircle className="w-2.5 h-2.5" />,
                    failed: <AlertTriangle className="w-2.5 h-2.5" />,
                    defaulted: <AlertTriangle className="w-2.5 h-2.5" />,
                };

                return (
                    <div className="flex flex-col gap-1">
                        <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${workflowStageBadgeClass(stage)}`}
                            title={
                                stage === 'counter_offer_sent'
                                    ? 'Reduced amount offered — waiting for borrower to agree or reject'
                                    : stage === 'offer_sent'
                                        ? 'Formal offer sent — waiting for borrower acceptance'
                                        : stage === 'ready_to_disburse'
                                            ? 'Borrower accepted — ready to disburse funds'
                                            : undefined
                            }
                        >
                            {iconMap[stage] || <FileText className="w-2.5 h-2.5" />}
                            {wf.workflow_label}
                        </span>
                        {wf.is_partial_offer && wf.awaiting_borrower_response && (
                            <span className="text-[9px] text-orange-600 dark:text-orange-400 font-semibold uppercase tracking-wide">
                                Awaiting borrower
                            </span>
                        )}
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
            render: (_: any, row: any) => {
                const wf = buildLoanWorkflowView(row);
                return (
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => onViewDetails(row)}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 dark:text-slate-400 hover:text-navy-600 dark:hover:text-blue-400 transition-colors"
                        title="View Details"
                    >
                        <Eye className="w-4 h-4" />
                    </button>

                    {(wf.workflow_stage === 'pending_review' || wf.workflow_stage === 'appeal_pending') && (
                        <>
                            <button
                                onClick={() => setApprovalLoan(row)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase tracking-wider hover:bg-emerald-100 transition-colors"
                                title={wf.has_open_appeal ? 'Review appeal and confirm new offer' : 'Confirm loan and send terms to borrower'}
                            >
                                <Check className="w-3 h-3" /> Confirm
                            </button>
                            <button
                                onClick={() => setRejectLoan(row)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 text-rose-700 text-[9px] font-black uppercase tracking-wider hover:bg-rose-100 transition-colors"
                                title="Reject with reason"
                            >
                                <X className="w-3 h-3" /> Reject
                            </button>
                        </>
                    )}

                    {wf.has_open_appeal && wf.appeal_comment && (
                        <span
                            className="inline-flex max-w-[140px] truncate items-center gap-1 px-2 py-1 rounded-lg bg-violet-50 text-violet-700 text-[9px] font-black uppercase tracking-wider"
                            title={wf.appeal_comment}
                        >
                            Appeal comment
                        </span>
                    )}

                    {wf.awaiting_borrower_response && (
                        <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                                wf.is_partial_offer
                                    ? 'bg-orange-50 text-orange-700'
                                    : 'bg-amber-50 text-amber-700'
                            }`}
                            title={
                                wf.is_partial_offer
                                    ? 'Counter-offer sent — waiting for cargo owner to agree or reject'
                                    : 'Offer sent — waiting for borrower to accept terms'
                            }
                        >
                            <Hourglass className="w-3 h-3" />
                            {wf.is_partial_offer ? 'Awaiting Agree/Reject' : 'Awaiting Acceptance'}
                        </span>
                    )}

                    {wf.ready_to_disburse && (
                        <button
                            onClick={() => setDisburseLoan(row)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black uppercase tracking-wider transition-colors shadow-sm"
                            title="Borrower accepted — disburse funds now"
                        >
                            <Send className="w-3 h-3" /> Pay Now
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
                );
            }
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

            {rejectLoan && (
                <LoanRejectModal
                    loan={rejectLoan}
                    onClose={() => setRejectLoan(null)}
                    onSuccess={() => {
                        const id = rejectLoan.id;
                        setRejectLoan(null);
                        // Modal already rejected via API — refresh list
                        void onApprove(id, {
                            approvedAmount: rejectLoan.requested_amount,
                            loanTermMonths: rejectLoan.loan_term_months ?? 3,
                            dueDate: rejectLoan.due_date ?? '',
                        });
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
