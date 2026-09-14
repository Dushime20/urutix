/**
 * Campaign freight estimate — cargo-owner facing indicative quote.
 *
 * This is a marketplace planning number (what a shipper might offer),
 * NOT full carrier operating-cost recovery (ATRI US × Africa × markup),
 * which priced single loads unrealistically high (~$20k+).
 *
 * Formula:
 *   roadKm × shipper $/truck-km × trucks (with fleet discount) or LTL share
 *   + light fuel + border fees
 */
import { MINIMUM_COST_USD, REGIONAL_MULTIPLIERS, DEFAULT_REGIONAL_MULTIPLIER } from '../matching/constants/freight-rates.constants';

/** East Africa / corridor shipper-facing all-in truck rate (USD per truck-km). */
export const SHIPPER_RATE_USD_PER_KM = 1.15;

/** Haversine → road distance uplift (modest). */
export const ROAD_DISTANCE_FACTOR = 1.15;

/** Fixed border / customs handling fee per cross-border child load (USD). */
export const CROSS_BORDER_FIXED_USD = 100;

/** Extra % of linehaul for cross-border dwell. */
export const CROSS_BORDER_LINEHAUL_PCT = 0.08;

/** Fuel already partly in shipper rate; keep a light surcharge. */
export const FUEL_SURCHARGE_PCT = 0.05;

/** LTL handling premium vs pro-rata FTL. */
export const LTL_HANDLING_PCT = 0.12;

/** Never bill LTL below this share of a full truck. */
export const LTL_MIN_TRUCK_SHARE = 0.18;

/** Bulk multi-truck discount (4% per extra truck, max 20%). */
export const FLEET_DISCOUNT_PER_EXTRA_TRUCK = 0.04;
export const FLEET_DISCOUNT_CAP = 0.2;

/** Clamp live median so a bad history sample cannot explode quotes. */
export const MARKET_RATE_MIN = 0.5;
export const MARKET_RATE_MAX = 2.2;

export const FTL_WEIGHT_KG = 28_000;
export const FTL_VOLUME_M3 = 76;

export interface LaneFreightInput {
  haversineKm: number;
  weightKg: number;
  volumeM3: number;
  originCountryCode: string;
  destinationCountryCode: string;
  preferSharedTrucks: boolean;
  /** Live median $/truck-km from tenant history when available. */
  marketRatePerKm?: number;
  ftlWeightKg?: number;
  ftlVolumeM3?: number;
}

export interface LaneFreightBreakdown {
  haversineKm: number;
  roadKm: number;
  regionalMultiplier: number;
  costPerKmUsd: number;
  rateSource: 'market_median' | 'shipper_corridor';
  trucksNeeded: number;
  utilization: number;
  loadType: 'FTL' | 'LTL';
  linehaulUsd: number;
  fuelSurchargeUsd: number;
  crossBorderFixedUsd: number;
  crossBorderLinehaulUsd: number;
  estimatedFreight: number;
  method: string;
}

export function regionalMultiplierFor(countryCode?: string): number {
  const code = (countryCode || '').toUpperCase();
  if (!code) return DEFAULT_REGIONAL_MULTIPLIER;
  return REGIONAL_MULTIPLIERS[code] ?? DEFAULT_REGIONAL_MULTIPLIER;
}

/**
 * Narrow band around 1.0 so we do not stack US-cost × Africa poverty premium
 * on top of an already East-Africa shipper rate.
 */
export function shipperRegionalFactor(originCode: string, destCode: string): number {
  const raw = Math.max(regionalMultiplierFor(originCode), regionalMultiplierFor(destCode));
  return Number(Math.min(1.15, Math.max(0.9, 0.75 + raw * 0.25)).toFixed(2));
}

export function roadKmFromHaversine(haversineKm: number): number {
  return Math.max(Math.round(Math.max(haversineKm, 1) * ROAD_DISTANCE_FACTOR), 40);
}

export function estimateLaneFreight(input: LaneFreightInput): LaneFreightBreakdown {
  const ftlWeight = input.ftlWeightKg || FTL_WEIGHT_KG;
  const ftlVolume = input.ftlVolumeM3 || FTL_VOLUME_M3;
  const weightKg = Math.max(input.weightKg, 1);
  const volumeM3 = Math.max(input.volumeM3, 0.1);
  const roadKm = roadKmFromHaversine(input.haversineKm);
  const crossBorder =
    (input.originCountryCode || '').toUpperCase() !== (input.destinationCountryCode || '').toUpperCase();

  const regionalMultiplier = shipperRegionalFactor(
    input.originCountryCode,
    input.destinationCountryCode,
  );

  const market = Number(input.marketRatePerKm);
  const useMarket =
    Number.isFinite(market) && market >= MARKET_RATE_MIN && market <= MARKET_RATE_MAX;
  const costPerKmUsd = useMarket
    ? Number(market.toFixed(2))
    : Number((SHIPPER_RATE_USD_PER_KM * regionalMultiplier).toFixed(2));
  const rateSource: LaneFreightBreakdown['rateSource'] = useMarket
    ? 'market_median'
    : 'shipper_corridor';

  const utilByWeight = weightKg / ftlWeight;
  const utilByVolume = volumeM3 / ftlVolume;
  const utilization = Math.min(1, Math.max(utilByWeight, utilByVolume));
  const trucksNeeded = Math.max(1, Math.ceil(utilByWeight), Math.ceil(utilByVolume));

  const preferLtl =
    input.preferSharedTrucks &&
    weightKg < ftlWeight * 0.7 &&
    volumeM3 < ftlVolume * 0.7 &&
    trucksNeeded === 1;
  const loadType: 'FTL' | 'LTL' = preferLtl ? 'LTL' : 'FTL';

  let linehaulUsd: number;
  if (loadType === 'FTL') {
    const fleetDiscount = Math.min(
      FLEET_DISCOUNT_CAP,
      Math.max(0, trucksNeeded - 1) * FLEET_DISCOUNT_PER_EXTRA_TRUCK,
    );
    linehaulUsd = trucksNeeded * roadKm * costPerKmUsd * (1 - fleetDiscount);
  } else {
    const truckShare = Math.max(utilization, LTL_MIN_TRUCK_SHARE);
    linehaulUsd = roadKm * costPerKmUsd * truckShare * (1 + LTL_HANDLING_PCT);
  }

  const fuelSurchargeUsd = linehaulUsd * FUEL_SURCHARGE_PCT;
  const crossBorderFixedUsd = crossBorder ? CROSS_BORDER_FIXED_USD : 0;
  const crossBorderLinehaulUsd = crossBorder ? linehaulUsd * CROSS_BORDER_LINEHAUL_PCT : 0;

  const estimatedFreight = Math.max(
    MINIMUM_COST_USD,
    Math.round(linehaulUsd + fuelSurchargeUsd + crossBorderFixedUsd + crossBorderLinehaulUsd),
  );

  const method =
    loadType === 'FTL'
      ? `FTL: ${trucksNeeded} truck(s) × ${roadKm} road-km × $${costPerKmUsd}/km` +
        (crossBorder ? ` + border $${CROSS_BORDER_FIXED_USD}+${Math.round(CROSS_BORDER_LINEHAUL_PCT * 100)}%` : '') +
        ` + fuel ${Math.round(FUEL_SURCHARGE_PCT * 100)}%`
      : `LTL: ${roadKm} road-km × $${costPerKmUsd}/km × ${Math.max(utilization, LTL_MIN_TRUCK_SHARE).toFixed(2)} util` +
        (crossBorder ? ` + border` : '') +
        ` + fuel ${Math.round(FUEL_SURCHARGE_PCT * 100)}%`;

  return {
    haversineKm: Math.round(input.haversineKm),
    roadKm,
    regionalMultiplier,
    costPerKmUsd,
    rateSource,
    trucksNeeded: loadType === 'FTL' ? trucksNeeded : 1,
    utilization: Number(utilization.toFixed(3)),
    loadType,
    linehaulUsd: Math.round(linehaulUsd),
    fuelSurchargeUsd: Math.round(fuelSurchargeUsd),
    crossBorderFixedUsd,
    crossBorderLinehaulUsd: Math.round(crossBorderLinehaulUsd),
    estimatedFreight,
    method,
  };
}
