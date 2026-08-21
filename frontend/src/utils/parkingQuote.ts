import type { ParkingFeeQuote, ParkingReservationFeeApplication, ParkingReservationFeeType } from '../types/parking';

export function roundParkingMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function effectiveParkingMonthlyRate(input: {
  months: number;
  monthlyRatePerSpace: number;
  longTermRate?: number | null;
  longTermMonths?: number | null;
}): number {
  const monthly = roundParkingMoney(Number(input.monthlyRatePerSpace) || 0);
  const longTerm = roundParkingMoney(Number(input.longTermRate) || 0);
  const threshold = Number(input.longTermMonths || 0);
  if (longTerm > 0 && threshold > 0 && input.months >= threshold) return longTerm;
  return monthly;
}

export function calculateParkingFeeQuote(input: {
  spaces: number;
  months: number;
  monthlyRatePerSpace: number;
  reservationFee: number;
  taxPercent: number;
  currency: string;
  reservationFeeType?: ParkingReservationFeeType;
  reservationFeeApplication?: ParkingReservationFeeApplication;
  taxEnabled?: boolean;
  taxName?: string;
}): ParkingFeeQuote {
  const currency = (input.currency || 'USD').trim().toUpperCase();
  const monthlyRatePerSpace = roundParkingMoney(Number(input.monthlyRatePerSpace) || 0);
  const occupancyAmount = roundParkingMoney(input.spaces * input.months * monthlyRatePerSpace);
  const feeValue = roundParkingMoney(Number(input.reservationFee) || 0);
  const type = (input.reservationFeeType || 'FIXED').toUpperCase();
  const application = (input.reservationFeeApplication || 'PER_RESERVATION').toUpperCase();
  let reservationFeeAmount = feeValue;
  if (type === 'PERCENTAGE' || application === 'PERCENT_OF_SUBTOTAL') {
    reservationFeeAmount = roundParkingMoney(occupancyAmount * (feeValue / 100));
  } else if (application === 'PER_SPACE') {
    reservationFeeAmount = roundParkingMoney(feeValue * input.spaces);
  }
  const subtotalAmount = roundParkingMoney(occupancyAmount + reservationFeeAmount);
  const taxEnabled = input.taxEnabled === false ? false : input.taxEnabled === true || (Number(input.taxPercent) || 0) > 0;
  const taxPercent = taxEnabled ? roundParkingMoney(Number(input.taxPercent) || 0) : 0;
  const taxName = (input.taxName || 'VAT').trim() || 'VAT';
  const taxAmount = roundParkingMoney(subtotalAmount * (taxPercent / 100));
  const totalAmount = roundParkingMoney(subtotalAmount + taxAmount);
  return {
    currency,
    occupancyAmount,
    reservationFeeAmount,
    subtotalAmount,
    taxPercent,
    taxAmount,
    totalAmount,
    taxName,
    monthlyRatePerSpace,
    spaces: input.spaces,
    months: input.months,
    lineItems: [],
  };
}
