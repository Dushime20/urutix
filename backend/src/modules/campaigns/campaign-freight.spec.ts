import {
  estimateLaneFreight,
  ROAD_DISTANCE_FACTOR,
  CROSS_BORDER_FIXED_USD,
  SHIPPER_RATE_USD_PER_KM,
  shipperRegionalFactor,
} from './campaign-freight';

describe('estimateLaneFreight', () => {
  it('prices a single FTL truck at shipper corridor rates — not US ATRI × Africa markup', () => {
    const quote = estimateLaneFreight({
      haversineKm: 800,
      weightKg: 28_000,
      volumeM3: 70,
      originCountryCode: 'RW',
      destinationCountryCode: 'KE',
      preferSharedTrucks: false,
    });
    expect(quote.roadKm).toBe(Math.round(800 * ROAD_DISTANCE_FACTOR));
    expect(quote.rateSource).toBe('shipper_corridor');
    expect(quote.loadType).toBe('FTL');
    expect(quote.trucksNeeded).toBe(1);
    expect(quote.crossBorderFixedUsd).toBe(CROSS_BORDER_FIXED_USD);
    const expectedRate = Number(
      (SHIPPER_RATE_USD_PER_KM * shipperRegionalFactor('RW', 'KE')).toFixed(2),
    );
    expect(quote.costPerKmUsd).toBe(expectedRate);
    // One Kigali→Nairobi-class truck should stay in a payable shipper range.
    expect(quote.estimatedFreight).toBeGreaterThan(800);
    expect(quote.estimatedFreight).toBeLessThan(2500);
  });

  it('uses tenant market median when provided (clamped)', () => {
    const quote = estimateLaneFreight({
      haversineKm: 400,
      weightKg: 5_000,
      volumeM3: 12,
      originCountryCode: 'KE',
      destinationCountryCode: 'KE',
      preferSharedTrucks: true,
      marketRatePerKm: 1.8,
    });
    expect(quote.rateSource).toBe('market_median');
    expect(quote.costPerKmUsd).toBe(1.8);
    expect(quote.loadType).toBe('LTL');
    expect(quote.crossBorderFixedUsd).toBe(0);
  });

  it('does not explode multi-truck bulk into unaffordable single-load quotes', () => {
    const quote = estimateLaneFreight({
      haversineKm: 700,
      weightKg: 84_000, // 3 × 28t trucks of cement
      volumeM3: 90,
      originCountryCode: 'RW',
      destinationCountryCode: 'KE',
      preferSharedTrucks: false,
    });
    expect(quote.trucksNeeded).toBe(3);
    expect(quote.estimatedFreight).toBeLessThan(8_000);
  });
});
