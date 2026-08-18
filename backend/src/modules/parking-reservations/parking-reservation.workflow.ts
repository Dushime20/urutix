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
  reservationFeeType?: 'FIXED' | 'PERCENTAGE';
  reservationFeeApplication?: 'PER_RESERVATION' | 'PER_SPACE' | 'PERCENT_OF_SUBTOTAL';
  taxEnabled?: boolean;
  taxName?: string;
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
  taxName: string;
  monthlyRatePerSpace: number;
  spaces: number;
  months: number;
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

export function calculateReservationFeeAmount(input: {
  occupancyAmount: number;
  spaces: number;
  reservationFee: number;
  reservationFeeType?: string;
  reservationFeeApplication?: string;
}): number {
  const value = toMoneyNumber(input.reservationFee);
  const type = (input.reservationFeeType || 'FIXED').toUpperCase();
  const application = (input.reservationFeeApplication || 'PER_RESERVATION').toUpperCase();
  if (type === 'PERCENTAGE' || application === 'PERCENT_OF_SUBTOTAL') {
    return roundMoney(input.occupancyAmount * (value / 100));
  }
  if (application === 'PER_SPACE') {
    return roundMoney(value * input.spaces);
  }
  return roundMoney(value);
}

export function calculateParkingFeeQuote(input: ParkingFeeInput): ParkingFeeQuote {
  const currency = (input.currency || 'USD').trim().toUpperCase();
  const monthlyRatePerSpace = toMoneyNumber(input.monthlyRatePerSpace);
  const occupancyAmount = roundMoney(input.spaces * input.months * monthlyRatePerSpace);
  const reservationFeeAmount = calculateReservationFeeAmount({
    occupancyAmount,
    spaces: input.spaces,
    reservationFee: input.reservationFee,
    reservationFeeType: input.reservationFeeType,
    reservationFeeApplication: input.reservationFeeApplication,
  });
  const subtotalAmount = roundMoney(occupancyAmount + reservationFeeAmount);
  const taxEnabled = input.taxEnabled === false
    ? false
    : input.taxEnabled === true || toMoneyNumber(input.taxPercent) > 0;
  const taxPercent = taxEnabled ? toMoneyNumber(input.taxPercent) : 0;
  const taxName = (input.taxName || 'VAT').trim() || 'VAT';
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
    taxName,
    monthlyRatePerSpace,
    spaces: input.spaces,
    months: input.months,
    lineItems: [
      {
        code: 'OCCUPANCY',
        description: `Truck parking occupancy (${input.spaces} space(s) × ${input.months} month(s))`,
        quantity: input.spaces * input.months,
        unitAmount: monthlyRatePerSpace,
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
        description: `${taxName} (${taxPercent}%)`,
        quantity: 1,
        unitAmount: taxAmount,
        amount: taxAmount,
      },
    ],
  };
}

export function validateContractLimits(input: {
  spaces: number;
  months: number;
  minSpaces?: number;
  maxSpaces?: number;
  minContractMonths?: number;
  maxContractMonths?: number;
}): string | null {
  const minSpaces = Math.max(1, Number(input.minSpaces || 1));
  const maxSpaces = Math.max(minSpaces, Number(input.maxSpaces || minSpaces));
  const minMonths = Math.max(1, Number(input.minContractMonths || 1));
  const maxMonths = Math.max(minMonths, Number(input.maxContractMonths || minMonths));
  if (input.spaces < minSpaces || input.spaces > maxSpaces) {
    return `Number of truck spaces must be between ${minSpaces} and ${maxSpaces}.`;
  }
  if (input.months < minMonths || input.months > maxMonths) {
    return `Contract duration must be between ${minMonths} and ${maxMonths} month(s).`;
  }
  return null;
}

export function feeSchedulePeriodsOverlap(
  aFrom: string,
  aUntil: string | null | undefined,
  bFrom: string,
  bUntil: string | null | undefined,
): boolean {
  const aStart = toUtcDateOnly(aFrom);
  const bStart = toUtcDateOnly(bFrom);
  const aEnd = aUntil ? toUtcDateOnly(aUntil) : new Date(Date.UTC(9999, 11, 31));
  const bEnd = bUntil ? toUtcDateOnly(bUntil) : new Date(Date.UTC(9999, 11, 31));
  return aStart.getTime() <= bEnd.getTime() && bStart.getTime() <= aEnd.getTime();
}

export function resolvePaymentDueAt(input: {
  paymentDueType?: string;
  paymentDueDays?: number;
  invoiceDate?: Date;
  startDate?: Date | string;
}): Date {
  const invoiceDate = input.invoiceDate || new Date();
  const days = Math.max(0, Number(input.paymentDueDays || 0));
  const type = (input.paymentDueType || 'DAYS_AFTER_INVOICE').toUpperCase();
  const start = input.startDate ? toUtcDateOnly(input.startDate) : invoiceDate;
  switch (type) {
    case 'IMMEDIATELY':
    case 'ON_INVOICE_DATE':
      return invoiceDate;
    case 'BEFORE_RESERVATION':
      return start;
    case 'DAYS_BEFORE_START':
      return addDays(start, -days);
    case 'DAYS_AFTER_INVOICE':
    default:
      return addDays(invoiceDate, days || 7);
  }
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

const COUNTRY_NAMES: Record<string, string> = {
  RW: 'Rwanda',
  KE: 'Kenya',
  UG: 'Uganda',
  TZ: 'Tanzania',
  BI: 'Burundi',
  SS: 'South Sudan',
  CD: 'DR Congo',
  ZA: 'South Africa',
  NG: 'Nigeria',
  ET: 'Ethiopia',
  GH: 'Ghana',
  ZM: 'Zambia',
  MW: 'Malawi',
  US: 'United States',
  GB: 'United Kingdom',
};

export function countryDisplayName(country?: string | null): string {
  const value = (country || '').trim();
  if (!value) return '';
  return COUNTRY_NAMES[value.toUpperCase()] || value;
}

export function formatParkingLocation(
  city?: string | null,
  country?: string | null,
  region?: string | null,
): string {
  const cityName = (city || '').trim();
  const regionName = (region || '').trim();
  const countryName = countryDisplayName(country);
  if (cityName && countryName) return `${cityName}, ${countryName}`;
  if (cityName && regionName) return `${cityName}, ${regionName}`;
  return cityName || regionName || countryName;
}
