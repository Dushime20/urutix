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
