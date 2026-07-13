import { PaymentStatus } from '../../../entities/payment.entity';
import { PaymentStatusTransitionException } from '../exceptions/payment.exceptions';

/**
 * Allowed status transitions for the payment state machine.
 *
 * Transition table:
 *   PENDING     → PROCESSING | COMPLETED | FAILED | CANCELLED
 *   PROCESSING  → COMPLETED  | FAILED    | CANCELLED
 *   ESCROW      → COMPLETED  | FAILED    | CANCELLED
 *   COMPLETED   → REFUNDED   (only — cannot reopen a completed payment)
 *   FAILED      → PENDING    (retry allowed)
 *   CANCELLED   → (terminal — no further transitions)
 *   REFUNDED    → (terminal — no further transitions)
 */
const ALLOWED_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  [PaymentStatus.PENDING]: [
    PaymentStatus.PROCESSING,
    PaymentStatus.COMPLETED,
    PaymentStatus.FAILED,
    PaymentStatus.CANCELLED,
  ],
  [PaymentStatus.PROCESSING]: [
    PaymentStatus.COMPLETED,
    PaymentStatus.FAILED,
    PaymentStatus.CANCELLED,
  ],
  [PaymentStatus.ESCROW]: [
    PaymentStatus.COMPLETED,
    PaymentStatus.FAILED,
    PaymentStatus.CANCELLED,
  ],
  [PaymentStatus.COMPLETED]: [
    PaymentStatus.REFUNDED,
  ],
  [PaymentStatus.FAILED]: [
    PaymentStatus.PENDING, // retry
  ],
  [PaymentStatus.CANCELLED]: [],   // terminal
  [PaymentStatus.REFUNDED]: [],    // terminal
};

/**
 * Assert that transitioning `payment` from its current status to `targetStatus`
 * is a valid state-machine move.  Throws `PaymentStatusTransitionException` if not.
 */
export function assertValidTransition(
  currentStatus: PaymentStatus,
  targetStatus: PaymentStatus,
): void {
  // No-op transition is always valid (e.g. saving metadata without changing status).
  if (currentStatus === targetStatus) return;

  const allowed = ALLOWED_TRANSITIONS[currentStatus] ?? [];
  if (!allowed.includes(targetStatus)) {
    throw new PaymentStatusTransitionException(currentStatus, targetStatus);
  }
}
