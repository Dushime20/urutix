/**
 * Platform default when a bid requires advance payment but omits the percentage.
 * Must stay aligned with frontend/src/utils/paymentCalculations.ts (70%).
 */
export const DEFAULT_ADVANCE_PAYMENT_PERCENTAGE = 70;

export interface ResolvedAdvancePercentage {
  percentage: number;
  usedDefault: boolean;
}

/**
 * Resolve the advance % to use for calculations and escrow splits.
 * - requireAdvancePayment=false → 0 (full balance due at completion)
 * - missing/invalid percentage → platform default (legacy bids)
 */
export function resolveAdvancePaymentPercentage(
  percentage: number | null | undefined,
  requireAdvancePayment: boolean,
): ResolvedAdvancePercentage {
  if (!requireAdvancePayment) {
    return { percentage: 0, usedDefault: false };
  }

  if (
    percentage !== undefined &&
    percentage !== null &&
    Number.isFinite(Number(percentage))
  ) {
    return { percentage: Number(percentage), usedDefault: false };
  }

  return {
    percentage: DEFAULT_ADVANCE_PAYMENT_PERCENTAGE,
    usedDefault: true,
  };
}
