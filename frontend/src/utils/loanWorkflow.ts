/**
 * Loan workflow stages — mirrors backend loan-workflow.util.ts
 * (confirm/reject → borrower review → agree → pay; or appeal after reject).
 */

export type LoanWorkflowStage =
  | 'pending_review'
  | 'appeal_pending'
  | 'offer_sent'
  | 'counter_offer_sent'
  | 'ready_to_disburse'
  | 'disbursed'
  | 'rejected'
  | 'repaid'
  | 'failed'
  | 'defaulted';

export interface LoanWorkflowInput {
  status: string;
  requested_amount?: number | null;
  approved_amount?: number | null;
  terms_offered_at?: string | Date | null;
  borrower_accepted_at?: string | Date | null;
  terms_declined_at?: string | Date | null;
  rejection_reason?: string | null;
  workflow_stage?: LoanWorkflowStage;
  workflow_label?: string;
  is_partial_offer?: boolean;
  amount_reduction?: number | null;
  can_appeal?: boolean;
  has_open_appeal?: boolean;
  appeal_comment?: string | null;
  metadata?: {
    offer_snapshot?: { is_partial_approval?: boolean };
    appeal?: {
      status?: string;
      comment?: string;
      submitted_at?: string;
    };
  } | null;
}

export interface LoanWorkflowView {
  workflow_stage: LoanWorkflowStage;
  workflow_label: string;
  is_partial_offer: boolean;
  amount_reduction: number | null;
  awaiting_borrower_response: boolean;
  ready_to_disburse: boolean;
  can_appeal: boolean;
  has_open_appeal: boolean;
  appeal_comment: string | null;
}

const STAGE_LABELS: Record<LoanWorkflowStage, string> = {
  pending_review: 'Pending Review',
  appeal_pending: 'Appeal Pending',
  offer_sent: 'Offer Sent',
  counter_offer_sent: 'Counter-Offer',
  ready_to_disburse: 'Ready to Fund',
  disbursed: 'Disbursed',
  rejected: 'Rejected',
  repaid: 'Repaid',
  failed: 'Failed',
  defaulted: 'Defaulted',
};

export function isPartialOffer(loan: LoanWorkflowInput): boolean {
  if (loan.is_partial_offer === true) return true;
  const requested = Number(loan.requested_amount ?? 0);
  const offered = Number(loan.approved_amount ?? 0);
  if (loan.metadata?.offer_snapshot?.is_partial_approval === true) return true;
  if (!requested || !offered) return false;
  return offered < requested - 0.01;
}

export function resolveLoanWorkflowStage(loan: LoanWorkflowInput): LoanWorkflowStage {
  if (loan.workflow_stage) return loan.workflow_stage;

  const status = String(loan.status || '').toLowerCase();
  const appealStatus = loan.metadata?.appeal?.status;

  if (status === 'pending' && appealStatus === 'pending_review') {
    return 'appeal_pending';
  }
  if (status === 'pending') return 'pending_review';
  if (status === 'disbursed') return 'disbursed';
  if (status === 'rejected') return 'rejected';
  if (status === 'repaid') return 'repaid';
  if (status === 'failed') return 'failed';
  if (status === 'defaulted') return 'defaulted';

  if (status === 'approved') {
    if (loan.borrower_accepted_at) return 'ready_to_disburse';
    if (loan.terms_offered_at || loan.approved_amount != null) {
      return isPartialOffer(loan) ? 'counter_offer_sent' : 'offer_sent';
    }
    return 'offer_sent';
  }

  return 'pending_review';
}

export function buildLoanWorkflowView(loan: LoanWorkflowInput): LoanWorkflowView {
  const workflow_stage = resolveLoanWorkflowStage(loan);
  const requested = Number(loan.requested_amount ?? 0);
  const offered = Number(loan.approved_amount ?? 0);
  const partial = isPartialOffer(loan);
  const appeal = loan.metadata?.appeal;

  return {
    workflow_stage,
    workflow_label: loan.workflow_label || STAGE_LABELS[workflow_stage],
    is_partial_offer: partial,
    amount_reduction:
      loan.amount_reduction != null
        ? loan.amount_reduction
        : partial && requested > 0 && offered > 0
          ? Math.round((requested - offered) * 100) / 100
          : null,
    awaiting_borrower_response:
      workflow_stage === 'offer_sent' || workflow_stage === 'counter_offer_sent',
    ready_to_disburse: workflow_stage === 'ready_to_disburse',
    can_appeal:
      loan.can_appeal ??
      (workflow_stage === 'rejected' &&
        appeal?.status !== 'pending_review' &&
        appeal?.status !== 'resolved'),
    has_open_appeal: loan.has_open_appeal ?? workflow_stage === 'appeal_pending',
    appeal_comment: loan.appeal_comment ?? appeal?.comment ?? null,
  };
}

export function workflowStageBadgeClass(stage: LoanWorkflowStage): string {
  switch (stage) {
    case 'pending_review':
      return 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50';
    case 'appeal_pending':
      return 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800/50';
    case 'offer_sent':
      return 'bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800/50';
    case 'counter_offer_sent':
      return 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800/50';
    case 'ready_to_disburse':
      return 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50';
    case 'disbursed':
      return 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/50';
    case 'rejected':
      return 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/50';
    case 'repaid':
      return 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50';
    case 'defaulted':
    case 'failed':
      return 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/50';
    default:
      return 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  }
}
