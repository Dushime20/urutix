import {
  applyBookingToSlice,
  cargoAllowedOnOffer,
  corridorOverlaps,
  fitsRemaining,
  hardFilterOffer,
  isLeftoverSellableSlice,
  nextOfferStatus,
  PLATFORM_CAPACITY_COMMISSION_RATE,
  quoteCommission,
  quoteFreight,
  remainingFromTrip,
  scoreOffer,
  utilizationPercent,
  type OfferMatchInput,
} from './capacity-matching';

const kigali = { name: 'Kigali', city: 'Kigali', country: 'Rwanda', countryCode: 'RW', lat: -1.9441, lng: 30.0619 };
const nairobi = { name: 'Nairobi', city: 'Nairobi', country: 'Kenya', countryCode: 'KE', lat: -1.2921, lng: 36.8219 };
const kampala = { name: 'Kampala', city: 'Kampala', country: 'Uganda', countryCode: 'UG', lat: 0.3476, lng: 32.5825 };

const leftover40: OfferMatchInput = {
  origin: kigali,
  destination: nairobi,
  departureAt: '2026-09-04T06:00:00.000Z',
  arrivalAt: '2026-09-06T18:00:00.000Z',
  remainingWeightKg: 11_200,
  remainingVolumeM3: 30.4,
  listedWeightKg: 11_200,
  listedVolumeM3: 30.4,
  floorPrice: 1800,
  pricePerTonne: 160,
  commissionRate: PLATFORM_CAPACITY_COMMISSION_RATE,
  compatibleCargoTypes: ['GENERAL'],
  generalCargoOnly: true,
  allowMixing: true,
  status: 'OPEN',
};

describe('Airbnb leftover capacity — Kigali → Nairobi 40% empty', () => {
  it('computes 40% leftover on a 28t truck that is 60% booked', () => {
    const slice = remainingFromTrip(28_000, 76, 16_800, 45.6);
    expect(slice.remainingWeightKg).toBe(11_200);
    expect(utilizationPercent(16_800, 28_000)).toBe(60);
  });

  it('sells 4 tonnes of the unused space on the same corridor', () => {
    const query = {
      origin: kigali,
      destination: nairobi,
      pickupAt: '2026-09-04T08:00:00.000Z',
      weightKg: 4_000,
      volumeM3: 10,
      cargoType: 'GENERAL',
    };
    expect(hardFilterOffer(leftover40, query)).toBeNull();
    expect(scoreOffer(leftover40, query)).toBeGreaterThan(50);
    expect(corridorOverlaps(leftover40, query)).toBe(true);
    expect(fitsRemaining(leftover40.remainingWeightKg, leftover40.remainingVolumeM3, 4_000, 10)).toBe(true);
  });

  it('rejects a Kampala destination that is not on the listed leg', () => {
    const query = {
      origin: kigali,
      destination: kampala,
      weightKg: 4_000,
      volumeM3: 8,
      cargoType: 'GENERAL',
    };
    expect(hardFilterOffer(leftover40, query)).toMatch(/corridor/i);
  });

  it('rejects a booking larger than remaining space', () => {
    expect(fitsRemaining(11_200, 30.4, 12_000, 10)).toBe(false);
    expect(
      hardFilterOffer(leftover40, {
        origin: kigali,
        destination: nairobi,
        weightKg: 12_000,
        volumeM3: 10,
        cargoType: 'GENERAL',
      }),
    ).toMatch(/remaining/i);
  });

  it('blocks hazardous cargo on a general-cargo leftover listing', () => {
    expect(cargoAllowedOnOffer(leftover40, 'HAZARDOUS', true)).toBe(false);
    expect(
      hardFilterOffer(leftover40, {
        origin: kigali,
        destination: nairobi,
        weightKg: 500,
        volumeM3: 1,
        cargoType: 'HAZARDOUS',
        isHazardous: true,
      }),
    ).toMatch(/not allowed/i);
  });

  it('quotes freight and an 8% cargo-owner commission on the matched remainder', () => {
    const freight = quoteFreight(leftover40, 4_000, 10);
    expect(freight).toBe(640);
    const commission = quoteCommission(freight);
    expect(commission.rate).toBe(8);
    expect(commission.amount).toBe(51.2);
    expect(commission.payer).toBe('CARGO_OWNER');
  });

  it('moves OPEN → PARTIALLY_BOOKED → FULL as leftover space is sold', () => {
    let slice = remainingFromTrip(28_000, 76, 16_800, 45.6);
    slice = applyBookingToSlice(slice, 4_000, 10, 'reserve');
    expect(slice.remainingWeightKg).toBe(7_200);
    expect(nextOfferStatus(slice.remainingWeightKg, slice.remainingVolumeM3, 'OPEN')).toBe('PARTIALLY_BOOKED');
    slice = applyBookingToSlice(slice, 7_200, 20.4, 'reserve');
    expect(slice.remainingWeightKg).toBe(0);
    expect(nextOfferStatus(slice.remainingWeightKg, slice.remainingVolumeM3, 'PARTIALLY_BOOKED')).toBe('FULL');
  });

  it('releases reserved kg when a request is rejected', () => {
    const reserved = applyBookingToSlice(
      { remainingWeightKg: 7_200, remainingVolumeM3: 20.4, allocatedWeightKg: 20_800, allocatedVolumeM3: 55.6 },
      4_000,
      10,
      'release',
    );
    expect(reserved.remainingWeightKg).toBe(11_200);
  });

  it('allows sell only partial loads on active trips', () => {
    expect(
      isLeftoverSellableSlice({
        tripId: 'trip-1',
        allocatedWeightKg: 16_800,
        remainingWeightKg: 11_200,
        utilizationPercent: 60,
      }),
    ).toBe(true);
    expect(
      isLeftoverSellableSlice({
        tripId: null,
        allocatedWeightKg: 0,
        remainingWeightKg: 28_000,
        utilizationPercent: 0,
      }),
    ).toBe(false);
    expect(
      isLeftoverSellableSlice({
        tripId: 'trip-1',
        allocatedWeightKg: 28_000,
        remainingWeightKg: 0,
        utilizationPercent: 100,
      }),
    ).toBe(false);
    expect(
      isLeftoverSellableSlice({
        tripId: 'trip-1',
        allocatedWeightKg: 16_800,
        remainingWeightKg: 11_200,
        utilizationPercent: 60,
        existingOfferId: 'offer-1',
      }),
    ).toBe(false);
  });
});
