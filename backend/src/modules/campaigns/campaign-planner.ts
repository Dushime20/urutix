export interface CorridorCity {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  region?: string;
  lat: number;
  lng: number;
}

export const FTL_WEIGHT_KG = 28_000;
export const FTL_VOLUME_M3 = 76;
export const FTL_RATE_PER_KM = 1.85;
export const ADVANCE_RATIO = 0.7;
export const INSURANCE_RATE = 0.0045;

export interface CampaignIntent {
  prompt?: string;
  productName: string;
  totalUnits: number;
  kgPerUnit: number;
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
  const ratePerKm = intent.ftlRatePerKm || FTL_RATE_PER_KM;
  const insuranceRate = intent.insuranceRate ?? INSURANCE_RATE;
  const advanceRatio = intent.advanceRatio ?? ADVANCE_RATIO;

  const destinations = destCities.map((city, index) => {
    const extra = remainder > 0 ? 1 : 0;
    if (remainder > 0) remainder -= 1;
    const units = baseUnits + extra;
    const weightKg = Math.max(Math.round(units * intent.kgPerUnit), 100);
    const volumeM3 = Math.max(Number((units * (intent.m3PerUnit || 0.004)).toFixed(2)), 0.1);
    const distanceKm = Math.max(haversineKm(origin.lat, origin.lng, city.lat, city.lng), 40);
    const preferLtl =
      intent.preferSharedTrucks &&
      weightKg < ftlWeight * 0.7 &&
      volumeM3 < ftlVolume * 0.7;
    const loadType: 'FTL' | 'LTL' = preferLtl ? 'LTL' : 'FTL';
    const utilization = Math.min(1, Math.max(weightKg / ftlWeight, volumeM3 / ftlVolume));
    const estimatedFreight =
      loadType === 'LTL'
        ? Math.round(distanceKm * ratePerKm * Math.max(utilization, 0.18) * 1.12)
        : Math.round(distanceKm * ratePerKm);
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
      distanceKm,
      loadType,
      estimatedFreight,
      pickupDate: addDays(intent.windowStart, pickupOffset),
      deliveryDate: addDays(intent.windowStart, pickupOffset + Math.max(2, Math.ceil(distanceKm / 450))),
      crossBorder: (city.countryCode || '').toUpperCase() !== (origin.countryCode || '').toUpperCase(),
    };
  });

  const estimatedFreight = destinations.reduce((s, d) => s + d.estimatedFreight, 0);
  const cargoValue = intent.totalUnits * intent.valuePerUnit;
  const insurancePremium = intent.requireInsurance ? Math.round(cargoValue * insuranceRate) : 0;
  const ltlCount = destinations.filter((d) => d.loadType === 'LTL').length;
  const ftlCount = destinations.filter((d) => d.loadType === 'FTL').length;
  const crossBorderCount = destinations.filter((d) => d.crossBorder).length;

  const operatorSteps = [
    { id: 'forecast', label: 'Forecast demand', layer: 'C', status: 'planned', detail: `Allocated ${intent.totalUnits} units across ${destinations.length} cities from the cargo owner intent.` },
    { id: 'suppliers', label: 'Find suppliers', layer: 'D', status: 'partner', detail: 'Pickup is the cargo owner origin warehouse. Supplier purchase is not auto-bound.' },
    { id: 'negotiate', label: 'Negotiate prices', layer: 'C', status: 'planned', detail: `Freight priced from live corridor distance at ${ratePerKm}/km.` },
    { id: 'inventory', label: 'Order inventory', layer: 'D', status: intent.goodsReady ? 'ready' : 'queued', detail: intent.goodsReady ? 'Goods marked ready at origin.' : 'Approve blocked until goods are ready.' },
    { id: 'financing', label: 'Arrange financing', layer: 'C', status: intent.fundOnEscrow ? 'planned' : 'queued', detail: intent.fundOnEscrow ? `Escrow advance ~${Math.round(advanceRatio * 100)}% per trip after a truck is assigned.` : 'Escrow funding off.' },
    { id: 'transport', label: 'Book transportation', layer: 'C', status: 'ready', detail: 'Creates published child loads and requests AI matches.' },
    { id: 'warehouses', label: 'Select warehouses', layer: 'C', status: 'planned', detail: `${origin.name} warehouse is the pickup hub.` },
    { id: 'routes', label: 'Optimize routes', layer: 'C', status: 'planned', detail: `${ltlCount} shared LTL / ${ftlCount} exclusive FTL.` },
    { id: 'customs', label: 'Handle customs', layer: 'C', status: crossBorderCount ? 'planned' : 'ready', detail: crossBorderCount ? `${crossBorderCount} cross-border loads flagged for a border pack.` : 'Domestic destinations only.' },
    { id: 'insurance', label: 'Insure cargo', layer: 'C', status: intent.requireInsurance ? 'planned' : 'queued', detail: intent.requireInsurance ? `Cover quote ${insurancePremium}.` : 'Cover not requested.' },
    { id: 'tracking', label: 'Track everything', layer: 'C', status: 'ready', detail: 'Child trips use existing GPS and ePOD once dispatched.' },
    { id: 'payments', label: 'Manage payments', layer: 'C', status: 'planned', detail: 'Settlement remains per trip; campaign rolls up freight vs budget.' },
    { id: 'reorder', label: 'Repeat this plan', layer: 'D', status: 'queued', detail: 'Clone next month as a new campaign. Goods auto-PO is not enabled.' },
  ];

  return {
    origin: { id: origin.id, name: origin.name, country: origin.country, countryCode: origin.countryCode, lat: origin.lat, lng: origin.lng },
    destinations,
    totalWeightKg: destinations.reduce((s, d) => s + d.weightKg, 0),
    totalVolumeM3: Number(destinations.reduce((s, d) => s + d.volumeM3, 0).toFixed(1)),
    ftlCount,
    ltlCount,
    sharedCapacityPct: destinations.length ? Math.round((ltlCount / destinations.length) * 100) : 0,
    estimatedFreight,
    estimatedAdvance: intent.fundOnEscrow ? Math.round(estimatedFreight * advanceRatio) : 0,
    insurancePremium,
    cargoValue,
    overBudget: intent.budgetCap > 0 && estimatedFreight + insurancePremium > intent.budgetCap,
    operatorSteps,
    rates: { ftlWeightKg: ftlWeight, ftlVolumeM3: ftlVolume, ftlRatePerKm: ratePerKm, insuranceRate, advanceRatio },
  };
}
