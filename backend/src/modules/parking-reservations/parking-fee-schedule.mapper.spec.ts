import {
  ParkingReservationFeeApplication,
  ParkingReservationFeeType,
} from '../../entities/parking-reservation.entity';
import {
  applySystemFeesToQuoteInput,
  normalizeParkingSystemFees,
  quoteFromSchedule,
} from './parking-fee-schedule.mapper';

describe('parking system fees', () => {
  it('normalizes missing settings to disabled defaults', () => {
    expect(normalizeParkingSystemFees(undefined)).toEqual({
      enabled: false,
      reservationFeeType: ParkingReservationFeeType.FIXED,
      reservationFeeValue: 20,
      reservationFeeApplication: ParkingReservationFeeApplication.PER_RESERVATION,
    });
  });

  it('overlays the platform reservation fee without changing occupancy', () => {
    const quote = quoteFromSchedule(
      {
        monthlyRatePerSpace: 200,
        reservationFeeValue: 5,
        reservationFeeType: ParkingReservationFeeType.FIXED,
        reservationFeeApplication: ParkingReservationFeeApplication.PER_RESERVATION,
        taxPercent: 0,
        taxEnabled: false,
        currency: 'USD',
      } as any,
      2,
      3,
      {
        enabled: true,
        reservationFeeType: ParkingReservationFeeType.FIXED,
        reservationFeeValue: 25,
        reservationFeeApplication: ParkingReservationFeeApplication.PER_SPACE,
      },
    );

    expect(quote.occupancyAmount).toBe(1200);
    expect(quote.reservationFeeAmount).toBe(50);
    expect(quote.totalAmount).toBe(1250);
  });

  it('leaves facility reservation fees in place when system fees are off', () => {
    const input = applySystemFeesToQuoteInput(
      {
        reservationFee: 9,
        reservationFeeType: ParkingReservationFeeType.FIXED,
        reservationFeeApplication: ParkingReservationFeeApplication.PER_RESERVATION,
      },
      { enabled: false, reservationFeeType: ParkingReservationFeeType.FIXED, reservationFeeValue: 40, reservationFeeApplication: ParkingReservationFeeApplication.PER_SPACE },
    );
    expect(input.reservationFee).toBe(9);
  });
});
