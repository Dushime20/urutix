/**
 * Payment calculation utilities for advance payments
 */

export type AdvancePaymentCalculation = {
  transportationFee: number;
  advancePaymentPercentage: number;
  advanceAmount: number;
  finalAmount: number;
  requireAdvancePayment: boolean;
  currency?: string;
};

/**
 * Calculate advance payment amounts based on transportation fee and percentage
 * @param transportationFee - The total transportation fee (bid amount)
 * @param advancePaymentPercentage - Percentage of advance payment (0-100)
 * @param requireAdvancePayment - Whether advance payment is required
 * @param currency - Currency code (default: 'USD')
 * @returns Calculation result with advance and final amounts
 */
export function calculateAdvancePayment(
  transportationFee: number,
  advancePaymentPercentage: number | null | undefined,
  requireAdvancePayment: boolean = true,
  currency: string = 'USD'
): AdvancePaymentCalculation {
  // If advance payment is not required, return full amount as final
  if (!requireAdvancePayment) {
    return {
      transportationFee,
      advancePaymentPercentage: 0,
      advanceAmount: 0,
      finalAmount: transportationFee,
      requireAdvancePayment: false,
      currency,
    };
  }

  // Use provided percentage or default to 70%
  const percentage = advancePaymentPercentage !== undefined && advancePaymentPercentage !== null
    ? advancePaymentPercentage
    : 70;

  // Validate percentage
  if (percentage < 0 || percentage > 100) {
    throw new Error('Advance payment percentage must be between 0 and 100');
  }

  // Calculate amounts with proper rounding to avoid floating point issues
  const advanceAmount = Math.round(transportationFee * (percentage / 100) * 100) / 100;
  const finalAmount = Math.round((transportationFee - advanceAmount) * 100) / 100;

  // Ensure total adds up correctly (adjust final if needed due to rounding)
  const total = Math.round((advanceAmount + finalAmount) * 100) / 100;
  const adjustedFinal = Math.abs(total - transportationFee) > 0.01
    ? Math.round((transportationFee - advanceAmount) * 100) / 100
    : finalAmount;

  return {
    transportationFee,
    advancePaymentPercentage: percentage,
    advanceAmount,
    finalAmount: adjustedFinal,
    requireAdvancePayment: true,
    currency,
  };
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format percentage
 */
export function formatPercentage(percentage: number | null | undefined | string): string {
  // Handle null, undefined, or non-numeric values
  if (percentage === null || percentage === undefined) {
    return '0.0%';
  }
  
  // Convert string to number if needed
  const numPercentage = typeof percentage === 'string' ? parseFloat(percentage) : percentage;
  
  // Check if it's a valid number
  if (isNaN(numPercentage) || !isFinite(numPercentage)) {
    return '0.0%';
  }
  
  return `${numPercentage.toFixed(1)}%`;
}

