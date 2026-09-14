import {
  estimateLaneFreight,
  ROAD_DISTANCE_FACTOR,
  CROSS_BORDER_FIXED_USD,
} from './campaign-freight';
import { BASE_COST_USD_PER_KM, CARRIER_MARKUP_OVER_COST } from '../matching/constants/freight-rates.constants';

describe('estimateLaneFreight', () => {
  it('converts air distance to road-km and applies regional ATRI markup', () => {
    const quote = estimateLaneFreight({
      haversineKm: 800,
      weightKg: 28_000,
      volumeM3: 70,
      originCountryCode: 'RW',
      destinationCountryCode: 'KE',
      preferSharedTrucks: false,
    });
    expect(quote.roadKm).toBe(Math.round(800 * ROAD_DISTANCE_FACTOR));
    expect(quote.rateSource).toBe('atri_regional');
    expect(quote.loadType).toBe('FTL');
    expect(quote.crossBorderFixedUsd).toBe(CROSS_BORDER_FIXED_USD);
    expect(quote.fuelSurchargeUsd).toBeGreaterThan(0);
    expect(quote.estimatedFreight).toBeGreaterThan(quote.linehaulUsd);
    const expectedRate = Number((BASE_COST_USD_PER_KM * Math.max(1.45, 1.35) * (1 + CARRIER_MARKUP_OVER_COST)).toFixed(2));
    expect(quote.costPerKmUsd).toBe(expectedRate);
  });

  it('uses tenant market median when provided', () => {
    const quote = estimateLaneFreight({
      haversineKm: 400,
      weightKg: 5_000,
      volumeM3: 12,
      originCountryCode: 'KE',
      destinationCountryCode: 'KE',
      preferSharedTrucks: true,
      marketRatePerKm: 2.1,
    });
    expect(quote.rateSource).toBe('market_median');
    expect(quote.costPerKmUsd).toBe(2.1);
    expect(quote.loadType).toBe('LTL');
    expect(quote.crossBorderFixedUsd).toBe(0);
  });
});
