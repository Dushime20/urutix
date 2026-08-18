import {
  ParkingReservationStatus,
  ParkingReservationActivityAction,
} from '../../entities/parking-reservation.entity';

export const PARKING_STATUS_TRANSITIONS: Record<
  ParkingReservationStatus,
  ParkingReservationStatus[]
> = {
  [ParkingReservationStatus.PENDING_REVIEW]: [
    ParkingReservationStatus.UNDER_REVIEW,
    ParkingReservationStatus.ADDITIONAL_INFORMATION_REQUIRED,
    ParkingReservationStatus.REJECTED,
    ParkingReservationStatus.CANCELLED,
  ],
  [ParkingReservationStatus.UNDER_REVIEW]: [
    ParkingReservationStatus.APPROVED,
    ParkingReservationStatus.REJECTED,
    ParkingReservationStatus.ADDITIONAL_INFORMATION_REQUIRED,
    ParkingReservationStatus.CANCELLED,
  ],
  [ParkingReservationStatus.ADDITIONAL_INFORMATION_REQUIRED]: [
    ParkingReservationStatus.UNDER_REVIEW,
    ParkingReservationStatus.APPROVED,
    ParkingReservationStatus.REJECTED,
    ParkingReservationStatus.CANCELLED,
  ],
  [ParkingReservationStatus.APPROVED]: [
    ParkingReservationStatus.CANCELLED,
    ParkingReservationStatus.COMPLETED,
    ParkingReservationStatus.EXPIRED,
  ],
  [ParkingReservationStatus.REJECTED]: [],
  [ParkingReservationStatus.CANCELLED]: [],
  [ParkingReservationStatus.EXPIRED]: [],
  [ParkingReservationStatus.COMPLETED]: [],
};

export function canTransition(
  from: ParkingReservationStatus,
  to: ParkingReservationStatus,
): boolean {
  return (PARKING_STATUS_TRANSITIONS[from] || []).includes(to);
}

export function formatReservationReference(year: number, sequence: number): string {
  return `PR-${year}-${String(sequence).padStart(6, '0')}`;
}

export function addMonths(startDate: Date, months: number): Date {
  const result = new Date(Date.UTC(
    startDate.getUTCFullYear(),
    startDate.getUTCMonth(),
    startDate.getUTCDate(),
  ));
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
}

export function toUtcDateOnly(value: string | Date): Date {
  if (value instanceof Date) {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }
  const [year, month, day] = value.split('T')[0].split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function toDateString(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function periodsOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function hasSufficientCapacity(
  totalCapacity: number,
  reservedSpaces: number,
  requestedSpaces: number,
): boolean {
  return reservedSpaces + requestedSpaces <= totalCapacity;
}

const MC_PATTERN = /^(MC[-\s]?)?\d{5,8}$/i;
const USDOT_PATTERN = /^(USDOT[-\s]?)?\d{5,8}$/i;
const PHONE_PATTERN = /^\+?[\d\s().-]{7,20}$/;

export function normalizeMcNumber(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, '');
}

export function normalizeUsdotNumber(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, '');
}

export function isValidMcNumber(value: string): boolean {
  return MC_PATTERN.test(normalizeMcNumber(value));
}

export function isValidUsdotNumber(value: string): boolean {
  return USDOT_PATTERN.test(normalizeUsdotNumber(value));
}

export function isValidPhone(value: string): boolean {
  return PHONE_PATTERN.test(value.trim());
}

export function startOfTodayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export function actionForTransition(
  to: ParkingReservationStatus,
): ParkingReservationActivityAction {
  switch (to) {
    case ParkingReservationStatus.UNDER_REVIEW:
      return ParkingReservationActivityAction.REVIEW_STARTED;
    case ParkingReservationStatus.ADDITIONAL_INFORMATION_REQUIRED:
      return ParkingReservationActivityAction.INFORMATION_REQUESTED;
    case ParkingReservationStatus.APPROVED:
      return ParkingReservationActivityAction.RESERVATION_APPROVED;
    case ParkingReservationStatus.REJECTED:
      return ParkingReservationActivityAction.RESERVATION_REJECTED;
    case ParkingReservationStatus.CANCELLED:
      return ParkingReservationActivityAction.RESERVATION_CANCELLED;
    default:
      return ParkingReservationActivityAction.STATUS_CHANGED;
  }
}

export type ParkingFeeInput = {
  spaces: number;
  months: number;
  monthlyRatePerSpace: number;
  reservationFee: number;
  taxPercent: number;
  currency: string;
};

export type ParkingFeeLineItem = {
  code: 'OCCUPANCY' | 'RESERVATION_FEE' | 'TAX';
  description: string;
  quantity: number;
  unitAmount: number;
  amount: number;
};

export type ParkingFeeQuote = {
  currency: string;
  occupancyAmount: number;
  reservationFeeAmount: number;
  subtotalAmount: number;
  taxPercent: number;
  taxAmount: number;
  totalAmount: number;
  lineItems: ParkingFeeLineItem[];
};

export function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function toMoneyNumber(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? roundMoney(parsed) : 0;
}

export function isValidIso4217Currency(code: string): boolean {
  return /^[A-Z]{3}$/.test((code || '').trim());
}

export function calculateParkingFeeQuote(input: ParkingFeeInput): ParkingFeeQuote {
  const currency = (input.currency || 'USD').trim().toUpperCase();
  const occupancyAmount = roundMoney(input.spaces * input.months * toMoneyNumber(input.monthlyRatePerSpace));
  const reservationFeeAmount = toMoneyNumber(input.reservationFee);
  const subtotalAmount = roundMoney(occupancyAmount + reservationFeeAmount);
  const taxPercent = toMoneyNumber(input.taxPercent);
  const taxAmount = roundMoney(subtotalAmount * (taxPercent / 100));
  const totalAmount = roundMoney(subtotalAmount + taxAmount);
  return {
    currency,
    occupancyAmount,
    reservationFeeAmount,
    subtotalAmount,
    taxPercent,
    taxAmount,
    totalAmount,
    lineItems: [
      {
        code: 'OCCUPANCY',
        description: `Truck parking occupancy (${input.spaces} space(s) × ${input.months} month(s))`,
        quantity: input.spaces * input.months,
        unitAmount: toMoneyNumber(input.monthlyRatePerSpace),
        amount: occupancyAmount,
      },
      {
        code: 'RESERVATION_FEE',
        description: 'Reservation / administration fee',
        quantity: 1,
        unitAmount: reservationFeeAmount,
        amount: reservationFeeAmount,
      },
      {
        code: 'TAX',
        description: `Tax / VAT (${taxPercent}%)`,
        quantity: 1,
        unitAmount: taxAmount,
        amount: taxAmount,
      },
    ],
  };
}

export function invoiceNumberFor(reservationReference: string): string {
  return `INV-${reservationReference}`;
}

export function addDays(from: Date, days: number): Date {
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
}

export function effectivePaymentStatus(
  status: string | undefined,
  dueAt?: Date | string | null,
): string {
  if (
    status === 'DUE' &&
    dueAt &&
    new Date(dueAt).getTime() < Date.now()
  ) {
    return 'OVERDUE';
  }
  return status || 'NOT_APPLICABLE';
}
