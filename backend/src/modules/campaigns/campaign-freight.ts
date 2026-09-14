/**
 * Campaign freight estimate — cargo-owner facing indicative quote.
 *
 * Built for international road corridors (not a binding carrier bid).
 * Formula mirrors industry practice:
 *   road km · regional operating cost · carrier markup · FTL trucks or LTL share
 *   + cross-border fees + fuel surcharge
 *
 * Sources aligned with matching constants:
 *   ATRI 2024 operating cost, IRU / World Bank regional multipliers.
 */
import {
  BASE_COST_USD_PER_KM,
  CARRIER_MARKUP_OVER_COST,
  DEFAULT_REGIONAL_MULTIPLIER,
  MINIMUM_COST_USD,
  REGIONAL_MULTIPLIERS,
} from '../matching/constants/freight-rates.constants';

/** Haversine understates road distance; East/Central Africa corridors often ~20–35% longer. */
export const ROAD_DISTANCE_FACTOR = 1.25;

/** Fixed border / customs handling fee per cross-border child load (USD). */
export const CROSS_BORDER_FIXED_USD = 180;

/** Extra % of linehaul for cross-border dwell, bond, and informal corridor costs. */
export const CROSS_BORDER_LINEHAUL_PCT = 0.12;

/** Spot fuel / energy surcharge on linehaul (indicative). */
export const FUEL_SURCHARGE_PCT = 0.08;

/** LTL consolidation handling premium vs pure pro-rata FTL. */
export const LTL_HANDLING_PCT = 0.15;

/** Never bill LTL below this share of a full truck (handling floor). */
export const LTL_MIN_TRUCK_SHARE = 0.18;

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
  rateSource: 'market_median' | 'atri_regional';
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

/** For cross-border lanes use the higher-cost country (landlocked / weak roads drive price). */
export function corridorRegionalMultiplier(originCode: string, destCode: string): number {
  return Math.max(regionalMultiplierFor(originCode), regionalMultiplierFor(destCode));
}

export function roadKmFromHaversine(haversineKm: number): number {
  return Math.max(Math.round(Math.max(haversineKm, 1) * ROAD_DISTANCE_FACTOR), 50);
}

export function estimateLaneFreight(input: LaneFreightInput): LaneFreightBreakdown {
  const ftlWeight = input.ftlWeightKg || FTL_WEIGHT_KG;
  const ftlVolume = input.ftlVolumeM3 || FTL_VOLUME_M3;
  const weightKg = Math.max(input.weightKg, 1);
  const volumeM3 = Math.max(input.volumeM3, 0.1);
  const roadKm = roadKmFromHaversine(input.haversineKm);
  const crossBorder =
    (input.originCountryCode || '').toUpperCase() !== (input.destinationCountryCode || '').toUpperCase();

  const regionalMultiplier = corridorRegionalMultiplier(
    input.originCountryCode,
    input.destinationCountryCode,
  );

  const market = Number(input.marketRatePerKm);
  const useMarket = Number.isFinite(market) && market >= 0.4 && market <= 8;
  const costPerKmUsd = useMarket
    ? Number(market.toFixed(2))
    : Number((BASE_COST_USD_PER_KM * regionalMultiplier * (1 + CARRIER_MARKUP_OVER_COST)).toFixed(2));
  const rateSource: LaneFreightBreakdown['rateSource'] = useMarket ? 'market_median' : 'atri_regional';

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
    // Full truck(s) for the corridor — standard international FTL quoting.
    linehaulUsd = trucksNeeded * roadKm * costPerKmUsd;
  } else {
    // LTL: pay a share of one truck + handling premium (not a free empty backhaul).
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
      : `LTL: ${roadKm} road-km × $${costPerKmUsd}/km × ${Math.max(utilization, LTL_MIN_TRUCK_SHARE).toFixed(2)} util × ${1 + LTL_HANDLING_PCT} handling` +
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
