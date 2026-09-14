import { estimateLaneFreight, FTL_VOLUME_M3, FTL_WEIGHT_KG } from './campaign-freight';

export interface CorridorCity {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  region?: string;
  lat: number;
  lng: number;
}

export { FTL_WEIGHT_KG, FTL_VOLUME_M3 };
/** @deprecated Prefer estimateLaneFreight shipper corridor rate; kept for marketRates override clamp. */
export const FTL_RATE_PER_KM = 1.15;
export const ADVANCE_RATIO = 0.7;
export const INSURANCE_RATE = 0.0045;

export interface CampaignIntent {
  prompt?: string;
  productName: string;
  totalUnits: number;
  /** Real pack weight in kg. Must come from the cargo owner or derived from totalWeightKg. */
  kgPerUnit: number;
  /** Explicit total shipment mass in kg when stated as tonnes/kg (optional source of truth). */
  totalWeightKg?: number;
  m3PerUnit: number;
  valuePerUnit: number;
  origin: CorridorCity;
  destinations: CorridorCity[];
  originCityId?: string;
  destinationCityIds?: string[];
  windowStart: string;
  windowEnd: string;
  budgetCap: number;
  slaPercent: number;
  preferSharedTrucks: boolean;
  requireInsurance: boolean;
  fundOnEscrow: boolean;
  goodsReady: boolean;
  currencyCode: string;
  ftlWeightKg?: number;
  ftlVolumeM3?: number;
  ftlRatePerKm?: number;
  insuranceRate?: number;
  advanceRatio?: number;
}

export const citySlug = (name: string, countryCode: string): string =>
  `${name}-${countryCode}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export const haversineKm = (aLat: number, aLng: number, bLat: number, bLng: number): number => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)));
};

const addDays = (iso: string, days: number): string => {
  const date = new Date(iso);
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

export function buildCampaignPlan(intent: CampaignIntent) {
  const origin = intent.origin;
  if (!origin?.lat || !origin?.lng) {
    throw new Error('Origin city is required');
  }
  const destCities = (intent.destinations || []).filter(
    (city) => city?.lat && city?.lng && citySlug(city.name, city.countryCode) !== citySlug(origin.name, origin.countryCode),
  );

  const cityCount = Math.max(destCities.length, 1);
  const baseUnits = Math.floor(intent.totalUnits / cityCount);
  let remainder = intent.totalUnits - baseUnits * cityCount;
  const spanMs = Math.max(
    new Date(intent.windowEnd).getTime() - new Date(intent.windowStart).getTime(),
    24 * 60 * 60 * 1000,
  );
  const spanDays = Math.max(Math.floor(spanMs / (24 * 60 * 60 * 1000)), destCities.length);
  const ftlWeight = intent.ftlWeightKg || FTL_WEIGHT_KG;
  const ftlVolume = intent.ftlVolumeM3 || FTL_VOLUME_M3;
  const marketRatePerKm = intent.ftlRatePerKm;
  const insuranceRate = intent.insuranceRate ?? INSURANCE_RATE;
  const advanceRatio = intent.advanceRatio ?? ADVANCE_RATIO;

  const destinations = destCities.map((city, index) => {
    const extra = remainder > 0 ? 1 : 0;
    if (remainder > 0) remainder -= 1;
    const units = baseUnits + extra;
    const weightKg = Math.max(Math.round(units * intent.kgPerUnit), 1);
    const volumeM3 = Math.max(Number((units * (intent.m3PerUnit || 0)).toFixed(2)), 0.1);
    const airKm = Math.max(haversineKm(origin.lat, origin.lng, city.lat, city.lng), 40);
    const freight = estimateLaneFreight({
      haversineKm: airKm,
      weightKg,
      volumeM3,
      originCountryCode: origin.countryCode,
      destinationCountryCode: city.countryCode,
      preferSharedTrucks: intent.preferSharedTrucks,
      marketRatePerKm,
      ftlWeightKg: ftlWeight,
      ftlVolumeM3: ftlVolume,
    });
    const pickupOffset = Math.floor((index / cityCount) * Math.max(spanDays - 4, 1));
    return {
      cityId: city.id || citySlug(city.name, city.countryCode),
      cityName: city.name,
      country: city.country,
      countryCode: city.countryCode,
      lat: city.lat,
      lng: city.lng,
      units,
      weightKg,
      volumeM3,
      distanceKm: freight.roadKm,
      haversineKm: freight.haversineKm,
      loadType: freight.loadType,
      estimatedFreight: freight.estimatedFreight,
      /** Cargo-owner offer; defaults to indicative freight until overridden. */
      offeredPrice: freight.estimatedFreight,
      freightBreakdown: freight,
      pickupDate: addDays(intent.windowStart, pickupOffset),
      deliveryDate: addDays(intent.windowStart, pickupOffset + Math.max(2, Math.ceil(freight.roadKm / 450))),
      crossBorder: (city.countryCode || '').toUpperCase() !== (origin.countryCode || '').toUpperCase(),
    };
  });

  const estimatedFreight = destinations.reduce((s, d) => s + d.estimatedFreight, 0);
  const offeredFreightTotal = destinations.reduce((s, d) => s + (d.offeredPrice || d.estimatedFreight), 0);
  const cargoValue = intent.totalUnits * intent.valuePerUnit;
  const insurancePremium = intent.requireInsurance ? Math.round(cargoValue * insuranceRate) : 0;
  const ltlCount = destinations.filter((d) => d.loadType === 'LTL').length;
  const ftlCount = destinations.filter((d) => d.loadType === 'FTL').length;
  const crossBorderCount = destinations.filter((d) => d.crossBorder).length;
  const totalWeightKg = destinations.reduce((s, d) => s + d.weightKg, 0);
  const rateSource = destinations[0]?.freightBreakdown?.rateSource || 'shipper_corridor';
  const sampleRate = destinations[0]?.freightBreakdown?.costPerKmUsd;

  const operatorSteps = [
    {
      id: 'forecast',
      label: 'Forecast demand',
      layer: 'C',
      status: 'planned',
      detail: `Allocated ${intent.totalUnits} units (${(totalWeightKg / 1000).toFixed(1)} t) across ${destinations.length} cities from the cargo owner weight.`,
    },
    {
      id: 'suppliers',
      label: 'Find suppliers',
      layer: 'D',
      status: 'partner',
      detail: 'Pickup is the cargo owner origin warehouse. Supplier purchase is not auto-bound.',
    },
    {
      id: 'negotiate',
      label: 'Negotiate prices',
      layer: 'C',
      status: 'planned',
      detail:
        rateSource === 'market_median'
          ? `Indicative freight from your tenant’s median offered lane rate (~$${sampleRate}/truck-km), road-km, FTL/LTL mix, fuel, and border fees.`
          : `Indicative freight from East Africa shipper corridor rates (~$${sampleRate}/truck-km), road-km, FTL/LTL mix, fuel, and border fees — a planning suggestion, not a binding bid.`,
    },
    {
      id: 'inventory',
      label: 'Order inventory',
      layer: 'D',
      status: intent.goodsReady ? 'ready' : 'queued',
      detail: intent.goodsReady ? 'Goods marked ready at origin.' : 'Approve blocked until goods are ready.',
    },
    {
      id: 'financing',
      label: 'Arrange financing',
      layer: 'C',
      status: intent.fundOnEscrow ? 'planned' : 'queued',
      detail: intent.fundOnEscrow
        ? `Escrow advance ~${Math.round(advanceRatio * 100)}% per trip after a truck is assigned.`
        : 'Escrow funding off.',
    },
    {
      id: 'transport',
      label: 'Book transportation',
      layer: 'C',
      status: 'ready',
      detail: 'Creates published child loads and requests AI matches.',
    },
    {
      id: 'warehouses',
      label: 'Select warehouses',
      layer: 'C',
      status: 'planned',
      detail: `${origin.name} warehouse is the pickup hub.`,
    },
    {
      id: 'routes',
      label: 'Optimize routes',
      layer: 'C',
      status: 'planned',
      detail: `${ltlCount} shared LTL / ${ftlCount} exclusive FTL.`,
    },
    {
      id: 'customs',
      label: 'Handle customs',
      layer: 'C',
      status: crossBorderCount ? 'planned' : 'ready',
      detail: crossBorderCount
        ? `${crossBorderCount} cross-border loads flagged for a border pack.`
        : 'Domestic destinations only.',
    },
    {
      id: 'insurance',
      label: 'Insure cargo',
      layer: 'C',
      status: intent.requireInsurance ? 'planned' : 'queued',
      detail: intent.requireInsurance ? `Cover quote ${insurancePremium}.` : 'Cover not requested.',
    },
    {
      id: 'tracking',
      label: 'Track everything',
      layer: 'C',
      status: 'ready',
      detail: 'Child trips use existing GPS and ePOD once dispatched.',
    },
    {
      id: 'payments',
      label: 'Manage payments',
      layer: 'C',
      status: 'planned',
      detail: 'Settlement remains per trip; campaign rolls up freight vs budget.',
    },
    {
      id: 'reorder',
      label: 'Repeat this plan',
      layer: 'D',
      status: 'queued',
      detail: 'Clone next month as a new campaign. Goods auto-PO is not enabled.',
    },
  ];

  return {
    origin: {
      id: origin.id,
      name: origin.name,
      country: origin.country,
      countryCode: origin.countryCode,
      lat: origin.lat,
      lng: origin.lng,
    },
    destinations,
    totalWeightKg,
    totalVolumeM3: Number(destinations.reduce((s, d) => s + d.volumeM3, 0).toFixed(1)),
    ftlCount,
    ltlCount,
    sharedCapacityPct: destinations.length ? Math.round((ltlCount / destinations.length) * 100) : 0,
    estimatedFreight,
    offeredFreightTotal,
    estimatedAdvance: intent.fundOnEscrow ? Math.round(offeredFreightTotal * advanceRatio) : 0,
    insurancePremium,
    cargoValue,
    overBudget: intent.budgetCap > 0 && offeredFreightTotal + insurancePremium > intent.budgetCap,
    operatorSteps,
    freightMethod:
      rateSource === 'market_median'
        ? 'Indicative: tenant median $/truck-km × road distance × FTL trucks or LTL share + fuel + border'
        : 'Indicative: East Africa shipper corridor $/truck-km × road distance × FTL/LTL + fuel + border',
    rates: {
      ftlWeightKg: ftlWeight,
      ftlVolumeM3: ftlVolume,
      ftlRatePerKm: sampleRate,
      insuranceRate,
      advanceRatio,
      rateSource,
      roadDistanceFactor: 1.15,
    },
  };
}
