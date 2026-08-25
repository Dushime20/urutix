import {
  actionForTransition,
  addMonths,
  calculateParkingFeeQuote,
  calculateReservationFeeAmount,
  canMarkParkingReservationPaidFromIshema,
  canTransition,
  effectivePaymentStatus,
  feeSchedulePeriodsOverlap,
  formatParkingLocation,
  formatReservationReference,
  hasSufficientCapacity,
  invoiceNumberFor,
  decideIshemaWebhookSettlement,
  isIshemaPaymentFailed,
  isIshemaPaymentSuccess,
  shouldReusePendingIshemaCollection,
  isValidMcNumber,
  isValidPhone,
  isValidUsdotNumber,
    ishemaPaidAmountMatchesRequired,
  resolveIshemaPaidAmount,
  periodsOverlap,
  resolvePaymentDueAt,
  toDateString,
  toUtcDateOnly,
  validateContractLimits,
} from './parking-reservation.workflow';
import { ParkingReservationStatus } from '../../entities/parking-reservation.entity';

describe('parking reservation workflow', () => {
  it('formats parking locations with country names', () => {
    expect(formatParkingLocation('Kigali', 'RW')).toBe('Kigali, Rwanda');
    expect(formatParkingLocation('Nairobi', 'Kenya')).toBe('Nairobi, Kenya');
    expect(formatParkingLocation('', 'KE')).toBe('Kenya');
    expect(formatParkingLocation('Kampala', '', 'Central')).toBe('Kampala, Central');
  });

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
    expect(quote.monthlyRatePerSpace).toBe(250);
    expect(invoiceNumberFor('PR-2026-000123')).toBe('INV-PR-2026-000123');
  });

  it('quotes 1×1, 10×3 and 100×12 occupancy', () => {
    expect(calculateParkingFeeQuote({
      spaces: 1, months: 1, monthlyRatePerSpace: 150, reservationFee: 0, taxPercent: 0, currency: 'USD',
    }).occupancyAmount).toBe(150);
    expect(calculateParkingFeeQuote({
      spaces: 10, months: 3, monthlyRatePerSpace: 150, reservationFee: 0, taxPercent: 0, currency: 'USD',
    }).occupancyAmount).toBe(4500);
    expect(calculateParkingFeeQuote({
      spaces: 100, months: 12, monthlyRatePerSpace: 150, reservationFee: 0, taxPercent: 0, currency: 'USD',
    }).occupancyAmount).toBe(180000);
  });

  it('supports fixed, percentage and zero reservation fees', () => {
    expect(calculateReservationFeeAmount({
      occupancyAmount: 9000, spaces: 20, reservationFee: 50, reservationFeeType: 'FIXED', reservationFeeApplication: 'PER_RESERVATION',
    })).toBe(50);
    expect(calculateReservationFeeAmount({
      occupancyAmount: 9000, spaces: 20, reservationFee: 10, reservationFeeType: 'FIXED', reservationFeeApplication: 'PER_SPACE',
    })).toBe(200);
    expect(calculateReservationFeeAmount({
      occupancyAmount: 9000, spaces: 20, reservationFee: 2, reservationFeeType: 'PERCENTAGE',
    })).toBe(180);
    expect(calculateReservationFeeAmount({
      occupancyAmount: 9000, spaces: 20, reservationFee: 0, reservationFeeType: 'FIXED',
    })).toBe(0);
  });

  it('applies 0% and 18% tax without double-taxing', () => {
    const zero = calculateParkingFeeQuote({
      spaces: 20, months: 3, monthlyRatePerSpace: 150, reservationFee: 180, taxPercent: 0, taxEnabled: true, currency: 'USD',
    });
    expect(zero.subtotalAmount).toBe(9180);
    expect(zero.taxAmount).toBe(0);
    expect(zero.totalAmount).toBe(9180);
    const vat = calculateParkingFeeQuote({
      spaces: 20, months: 3, monthlyRatePerSpace: 150, reservationFee: 180, taxPercent: 18, taxName: 'VAT', currency: 'USD',
    });
    expect(vat.occupancyAmount).toBe(9000);
    expect(vat.reservationFeeAmount).toBe(180);
    expect(vat.subtotalAmount).toBe(9180);
    expect(vat.taxAmount).toBe(1652.4);
    expect(vat.totalAmount).toBe(10832.4);
    expect(vat.taxName).toBe('VAT');
  });

  it('validates contract space and month limits', () => {
    expect(validateContractLimits({ spaces: 0, months: 1, minSpaces: 1, maxSpaces: 50 })).toMatch(/spaces/);
    expect(validateContractLimits({ spaces: 60, months: 1, minSpaces: 1, maxSpaces: 50 })).toMatch(/spaces/);
    expect(validateContractLimits({ spaces: 1, months: 24, minContractMonths: 1, maxContractMonths: 12 })).toMatch(/duration/);
    expect(validateContractLimits({ spaces: 10, months: 3, minSpaces: 1, maxSpaces: 50, minContractMonths: 1, maxContractMonths: 12 })).toBeNull();
  });

  it('prevents overlapping fee schedule periods', () => {
    expect(feeSchedulePeriodsOverlap('2026-01-01', '2026-12-31', '2026-06-01', '2026-12-31')).toBe(true);
    expect(feeSchedulePeriodsOverlap('2026-01-01', '2026-06-30', '2026-07-01', '2026-12-31')).toBe(false);
    expect(feeSchedulePeriodsOverlap('2026-01-01', null, '2026-06-01', '2026-12-31')).toBe(true);
  });

  it('resolves payment due dates from payment terms', () => {
    const invoice = new Date('2026-08-01T00:00:00.000Z');
    expect(resolvePaymentDueAt({ paymentDueType: 'IMMEDIATELY', invoiceDate: invoice }).toISOString()).toBe(invoice.toISOString());
    expect(resolvePaymentDueAt({ paymentDueType: 'DAYS_AFTER_INVOICE', paymentDueDays: 7, invoiceDate: invoice }).toISOString()).toBe('2026-08-08T00:00:00.000Z');
  });

  it('keeps historical quotes independent of later rate changes', () => {
    const original = calculateParkingFeeQuote({
      spaces: 20, months: 3, monthlyRatePerSpace: 150, reservationFee: 0, taxPercent: 0, currency: 'USD',
    });
    const updated = calculateParkingFeeQuote({
      spaces: 20, months: 3, monthlyRatePerSpace: 180, reservationFee: 0, taxPercent: 0, currency: 'USD',
    });
    expect(original.occupancyAmount).toBe(9000);
    expect(updated.occupancyAmount).toBe(10800);
  });

  it('marks unpaid invoices overdue after the due date', () => {
    expect(effectivePaymentStatus('DUE', new Date(Date.now() - 60_000))).toBe('OVERDUE');
    expect(effectivePaymentStatus('DUE', new Date(Date.now() + 60_000))).toBe('DUE');
    expect(effectivePaymentStatus('PAID', new Date(Date.now() - 60_000))).toBe('PAID');
  });

  it('marks an Ishema parking payment paid only on success with matching amount', () => {
    expect(isIshemaPaymentSuccess('success')).toBe(true);
    expect(isIshemaPaymentSuccess('pending')).toBe(false);
    expect(isIshemaPaymentFailed('failed')).toBe(true);
    expect(ishemaPaidAmountMatchesRequired(15000, 15000)).toBe(true);
    expect(ishemaPaidAmountMatchesRequired(15000.4, 15000)).toBe(true);
    expect(ishemaPaidAmountMatchesRequired(15000, 14000)).toBe(false);
    expect(ishemaPaidAmountMatchesRequired(15000, null)).toBe(false);
    expect(
      canMarkParkingReservationPaidFromIshema({
        providerStatus: 'success',
        requiredAmount: 25000,
        paidAmount: 25000,
      }),
    ).toBe(true);
    expect(
      canMarkParkingReservationPaidFromIshema({
        providerStatus: 'pending',
        requiredAmount: 25000,
        paidAmount: 25000,
      }),
    ).toBe(false);
    expect(isIshemaPaymentSuccess('successful')).toBe(true);
    expect(isIshemaPaymentSuccess('paid')).toBe(true);
    expect(
      canMarkParkingReservationPaidFromIshema({
        providerStatus: 'success',
        requiredAmount: 25000,
        paidAmount: 20000,
      }),
    ).toBe(false);
    expect(
      canMarkParkingReservationPaidFromIshema({
        providerStatus: 'failed',
        requiredAmount: 25000,
        paidAmount: 25000,
      }),
    ).toBe(false);
    expect(
      resolveIshemaPaidAmount({
        providerStatus: 'success',
        paidAmount: null,
        requestedAmount: 184800,
      }),
    ).toBe(184800);
    expect(
      resolveIshemaPaidAmount({
        providerStatus: 'pending',
        paidAmount: null,
        requestedAmount: 184800,
      }),
    ).toBeNull();
  });

  it('does not settle money from an unsigned failed callback while GET is pending', () => {
    expect(
      decideIshemaWebhookSettlement({
        claimedStatus: 'failed',
        claimedStatusCode: 500,
        providerStatus: 'pending',
      }),
    ).toBe('prompt_undelivered');
    expect(
      decideIshemaWebhookSettlement({
        claimedStatus: 'failed',
        claimedStatusCode: 500,
        providerStatus: 'failed',
      }),
    ).toBe('settle_failed');
    expect(
      decideIshemaWebhookSettlement({
        claimedStatus: 'success',
        providerStatus: 'success',
      }),
    ).toBe('settle_success');
    expect(
      decideIshemaWebhookSettlement({
        claimedStatus: 'pending',
        providerStatus: 'pending',
      }),
    ).toBe('wait');
  });

  it('reuses a pending Ishema collection only while the USSD could still be on the phone', () => {
    const initiatedAt = new Date('2026-08-24T16:15:00.000Z');
    expect(
      shouldReusePendingIshemaCollection({
        providerStatus: 'pending',
        initiatedAt,
        now: new Date('2026-08-24T16:15:20.000Z'),
      }),
    ).toBe(true);
    expect(
      shouldReusePendingIshemaCollection({
        providerStatus: 'pending',
        promptUndelivered: true,
        initiatedAt,
        now: new Date('2026-08-24T16:15:20.000Z'),
      }),
    ).toBe(false);
    expect(
      shouldReusePendingIshemaCollection({
        providerStatus: 'pending',
        initiatedAt,
        now: new Date('2026-08-24T16:17:00.000Z'),
      }),
    ).toBe(false);
    expect(
      shouldReusePendingIshemaCollection({
        providerStatus: 'pending',
      }),
    ).toBe(false);
  });
});
