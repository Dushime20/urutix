/**
 * Loan workflow stages (TILA / consumer-credit offer → accept → disburse).
 *
 * DB status `approved` means a formal offer exists — not that the loan is fully booked.
 * These stages drive lender/borrower UI so partial offers read as counter-offers.
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
  terms_offered_at?: Date | string | null;
  borrower_accepted_at?: Date | string | null;
  terms_declined_at?: Date | string | null;
  rejection_reason?: string | null;
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
  const requested = Number(loan.requested_amount ?? 0);
  const offered = Number(loan.approved_amount ?? 0);
  if (loan.metadata?.offer_snapshot?.is_partial_approval === true) return true;
  if (!requested || !offered) return false;
  return offered < requested - 0.01;
}

export function resolveLoanWorkflowStage(loan: LoanWorkflowInput): LoanWorkflowStage {
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
    workflow_label: STAGE_LABELS[workflow_stage],
    is_partial_offer: partial,
    amount_reduction:
      partial && requested > 0 && offered > 0
        ? Math.round((requested - offered) * 100) / 100
        : null,
    awaiting_borrower_response:
      workflow_stage === 'offer_sent' || workflow_stage === 'counter_offer_sent',
    ready_to_disburse: workflow_stage === 'ready_to_disburse',
    can_appeal:
      workflow_stage === 'rejected' &&
      appeal?.status !== 'pending_review' &&
      appeal?.status !== 'resolved',
    has_open_appeal: workflow_stage === 'appeal_pending',
    appeal_comment: appeal?.comment ?? null,
  };
}
