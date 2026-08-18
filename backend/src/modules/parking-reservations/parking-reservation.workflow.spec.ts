import {
  actionForTransition,
  addMonths,
  calculateParkingFeeQuote,
  canTransition,
  effectivePaymentStatus,
  formatReservationReference,
  hasSufficientCapacity,
  invoiceNumberFor,
  isValidMcNumber,
  isValidPhone,
  isValidUsdotNumber,
  periodsOverlap,
  toDateString,
  toUtcDateOnly,
} from './parking-reservation.workflow';
import { ParkingReservationStatus } from '../../entities/parking-reservation.entity';

describe('parking reservation workflow', () => {
  it('formats reservation references', () => {
    expect(formatReservationReference(2026, 123)).toBe('PR-2026-000123');
  });

  it('allows only explicit status transitions', () => {
    expect(canTransition(ParkingReservationStatus.PENDING_REVIEW, ParkingReservationStatus.UNDER_REVIEW)).toBe(true);
    expect(canTransition(ParkingReservationStatus.UNDER_REVIEW, ParkingReservationStatus.APPROVED)).toBe(true);
    expect(canTransition(ParkingReservationStatus.UNDER_REVIEW, ParkingReservationStatus.REJECTED)).toBe(true);
    expect(canTransition(ParkingReservationStatus.UNDER_REVIEW, ParkingReservationStatus.ADDITIONAL_INFORMATION_REQUIRED)).toBe(true);
    expect(canTransition(ParkingReservationStatus.ADDITIONAL_INFORMATION_REQUIRED, ParkingReservationStatus.UNDER_REVIEW)).toBe(true);
    expect(canTransition(ParkingReservationStatus.APPROVED, ParkingReservationStatus.CANCELLED)).toBe(true);
    expect(canTransition(ParkingReservationStatus.APPROVED, ParkingReservationStatus.PENDING_REVIEW)).toBe(false);
    expect(canTransition(ParkingReservationStatus.REJECTED, ParkingReservationStatus.APPROVED)).toBe(false);
  });

  it('calculates contract end dates', () => {
    const start = toUtcDateOnly('2026-09-01');
    const end = addMonths(start, 3);
    expect(toDateString(end)).toBe('2026-12-01');
  });

  it('detects overlapping periods and capacity', () => {
    const aStart = toUtcDateOnly('2026-09-01');
    const aEnd = addMonths(aStart, 3);
    const bStart = toUtcDateOnly('2026-11-01');
    const bEnd = addMonths(bStart, 3);
    expect(periodsOverlap(aStart, aEnd, bStart, bEnd)).toBe(true);
    expect(hasSufficientCapacity(700, 690, 10)).toBe(true);
    expect(hasSufficientCapacity(700, 691, 10)).toBe(false);
    expect(hasSufficientCapacity(700, 0, 700)).toBe(true);
  });

  it('validates MC, USDOT and phone numbers', () => {
    expect(isValidMcNumber('MC123456')).toBe(true);
    expect(isValidMcNumber('123456')).toBe(true);
    expect(isValidMcNumber('AB')).toBe(false);
    expect(isValidUsdotNumber('USDOT123456')).toBe(true);
    expect(isValidUsdotNumber('1234567')).toBe(true);
    expect(isValidPhone('+1 (555) 123-4567')).toBe(true);
    expect(isValidPhone('12')).toBe(false);
  });

  it('maps approval to an audit action', () => {
    expect(actionForTransition(ParkingReservationStatus.APPROVED)).toBe('RESERVATION_APPROVED');
  });

  it('quotes occupancy, reservation fee and tax using ISO money rounding', () => {
    const quote = calculateParkingFeeQuote({
      spaces: 2,
      months: 3,
      monthlyRatePerSpace: 250,
      reservationFee: 25,
      taxPercent: 10,
      currency: 'USD',
    });
    expect(quote.occupancyAmount).toBe(1500);
    expect(quote.reservationFeeAmount).toBe(25);
    expect(quote.subtotalAmount).toBe(1525);
    expect(quote.taxAmount).toBe(152.5);
    expect(quote.totalAmount).toBe(1677.5);
    expect(quote.currency).toBe('USD');
    expect(invoiceNumberFor('PR-2026-000123')).toBe('INV-PR-2026-000123');
  });

  it('marks unpaid invoices overdue after the due date', () => {
    expect(effectivePaymentStatus('DUE', new Date(Date.now() - 60_000))).toBe('OVERDUE');
    expect(effectivePaymentStatus('DUE', new Date(Date.now() + 60_000))).toBe('DUE');
    expect(effectivePaymentStatus('PAID', new Date(Date.now() - 60_000))).toBe('PAID');
  });
});
