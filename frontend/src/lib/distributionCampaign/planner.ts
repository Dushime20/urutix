import { CORRIDOR_CITIES, cityById } from './cities';
import {
  ADVANCE_RATIO,
  FTL_RATE_PER_KM,
  FTL_VOLUME_M3,
  FTL_WEIGHT_KG,
  INSURANCE_RATE,
  type CampaignIntent,
  type CampaignPlan,
  type OperatorStep,
  type PlannedDestination,
} from './types';

const haversineKm = (aLat: number, aLng: number, bLat: number, bLng: number): number => {
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

const buildOperatorSteps = (intent: CampaignIntent, plan: Omit<CampaignPlan, 'operatorSteps'>): OperatorStep[] => {
  const crossBorderCount = plan.destinations.filter((d) => d.crossBorder).length;
  return [
    {
      id: 'forecast',
      label: 'Forecast demand',
      detail: `Allocates the ${intent.totalUnits.toLocaleString()} units you stated across ${plan.destinations.length} cities. Lane heatmaps can refine the split later.`,
      layer: 'C',
      status: 'planned',
    },
    {
      id: 'suppliers',
      label: 'Find suppliers',
      detail: 'Your origin warehouse is the pickup. Supplier sourcing is a later partner layer — not auto-purchased.',
      layer: 'D',
      status: 'partner',
    },
    {
      id: 'negotiate',
      label: 'Negotiate prices',
      detail: 'Freight is priced from corridor distance and FTL/LTL mix. Goods prices stay with your company contracts.',
      layer: 'C',
      status: 'planned',
    },
    {
      id: 'inventory',
      label: 'Order inventory',
      detail: intent.goodsReady
        ? 'You marked goods ready at origin. No purchase order is created.'
        : 'Approve is blocked until you confirm goods are ready at origin.',
      layer: 'D',
      status: intent.goodsReady ? 'queued' : 'queued',
    },
    {
      id: 'financing',
      label: 'Arrange financing',
      detail: intent.fundOnEscrow
        ? `Trip facilities draw ~${Math.round(ADVANCE_RATIO * 100)}% advance against escrowed freight, per trip — not one lump for all cities.`
        : 'Escrow funding is off. Carriers will wait on your payment terms.',
      layer: 'C',
      status: 'planned',
    },
    {
      id: 'transport',
      label: 'Book transportation',
      detail: `Creates ${plan.destinations.length} child loads. Shared/LTL preferred so leftover truck space can fill the slices.`,
      layer: 'C',
      status: 'ready',
    },
    {
      id: 'warehouses',
      label: 'Select warehouses',
      detail: 'Origin is treated as your warehouse / DC. 3PL slot booking is not in this release.',
      layer: 'C',
      status: 'planned',
    },
    {
      id: 'routes',
      label: 'Optimize routes',
      detail: `${plan.ltlCount} shared (LTL) and ${plan.ftlCount} exclusive (FTL) movements from distance and remaining capacity.`,
      layer: 'C',
      status: 'planned',
    },
    {
      id: 'customs',
      label: 'Handle customs',
      detail:
        crossBorderCount > 0
          ? `${crossBorderCount} destinations cross a border. Each child load needs a document pack before dispatch.`
          : 'All destinations are in the origin country.',
      layer: 'C',
      status: crossBorderCount > 0 ? 'planned' : 'ready',
    },
    {
      id: 'insurance',
      label: 'Insure cargo',
      detail: intent.requireInsurance
        ? `Cover estimated at ${(INSURANCE_RATE * 100).toFixed(2)}% of cargo value. Bind happens at booking with a partner.`
        : 'Cargo cover not requested.',
      layer: 'C',
      status: intent.requireInsurance ? 'planned' : 'queued',
    },
    {
      id: 'tracking',
      label: 'Track everything',
      detail: 'Child trips use existing live tracking and ePOD. This board is a filter, not a second tracker.',
      layer: 'C',
      status: 'ready',
    },
    {
      id: 'payments',
      label: 'Manage payments',
      detail: 'Settlement stays per trip (commission → cover → fuel recovery → loan → carrier). This campaign rolls up the P&L.',
      layer: 'C',
      status: 'planned',
    },
    {
      id: 'reorder',
      label: 'Repeat this plan',
      detail: 'After execution you can clone next month’s freight plan. Goods auto-reorder is not enabled.',
      layer: 'D',
      status: 'queued',
    },
  ];
};

export const buildPlan = (intent: CampaignIntent): CampaignPlan => {
  const origin = cityById(intent.originCityId) ?? CORRIDOR_CITIES[0];
  const destCities = intent.destinationCityIds
    .map((id) => cityById(id))
    .filter((city): city is NonNullable<typeof city> => Boolean(city) && city.id !== origin.id);

  const cityCount = Math.max(destCities.length, 1);
  const baseUnits = Math.floor(intent.totalUnits / cityCount);
  let remainder = intent.totalUnits - baseUnits * cityCount;

  const spanMs = Math.max(
    new Date(intent.windowEnd).getTime() - new Date(intent.windowStart).getTime(),
    24 * 60 * 60 * 1000,
  );
  const spanDays = Math.max(Math.floor(spanMs / (24 * 60 * 60 * 1000)), destCities.length);

  const destinations: PlannedDestination[] = destCities.map((city, index) => {
    const extra = remainder > 0 ? 1 : 0;
    if (remainder > 0) remainder -= 1;
    const units = baseUnits + extra;
    const weightKg = Math.max(units * intent.kgPerUnit, 100);
    const volumeM3 = Math.max(Number((units * intent.m3PerUnit).toFixed(2)), 0.1);
    const distanceKm = Math.max(haversineKm(origin.lat, origin.lng, city.lat, city.lng), 40);
    const preferLtl = intent.preferSharedTrucks && weightKg < FTL_WEIGHT_KG * 0.7 && volumeM3 < FTL_VOLUME_M3 * 0.7;
    const loadType: 'FTL' | 'LTL' = preferLtl ? 'LTL' : 'FTL';
    const utilization = Math.min(1, Math.max(weightKg / FTL_WEIGHT_KG, volumeM3 / FTL_VOLUME_M3));
    const freight =
      loadType === 'LTL'
        ? Math.round(distanceKm * FTL_RATE_PER_KM * Math.max(utilization, 0.18) * 1.12)
        : Math.round(distanceKm * FTL_RATE_PER_KM);
    const pickupOffset = Math.floor((index / cityCount) * Math.max(spanDays - 4, 1));
    return {
      cityId: city.id,
      cityName: city.name,
      country: city.country,
      countryCode: city.countryCode,
      lat: city.lat,
      lng: city.lng,
      units,
      weightKg: Math.round(weightKg),
      volumeM3,
      distanceKm,
      loadType,
      estimatedFreight: freight,
      pickupDate: addDays(intent.windowStart, pickupOffset),
      deliveryDate: addDays(intent.windowStart, pickupOffset + Math.max(2, Math.ceil(distanceKm / 450))),
      crossBorder: city.countryCode !== origin.countryCode,
    };
  });

  const totalWeightKg = destinations.reduce((sum, d) => sum + d.weightKg, 0);
  const totalVolumeM3 = destinations.reduce((sum, d) => sum + d.volumeM3, 0);
  const ftlCount = destinations.filter((d) => d.loadType === 'FTL').length;
  const ltlCount = destinations.filter((d) => d.loadType === 'LTL').length;
  const estimatedFreight = destinations.reduce((sum, d) => sum + d.estimatedFreight, 0);
  const cargoValue = intent.totalUnits * intent.valuePerUnit;
  const insurancePremium = intent.requireInsurance ? Math.round(cargoValue * INSURANCE_RATE) : 0;

  const partial: Omit<CampaignPlan, 'operatorSteps'> = {
    destinations,
    totalWeightKg,
    totalVolumeM3: Number(totalVolumeM3.toFixed(1)),
    ftlCount,
    ltlCount,
    sharedCapacityPct: destinations.length ? Math.round((ltlCount / destinations.length) * 100) : 0,
    estimatedFreight,
    estimatedAdvance: intent.fundOnEscrow ? Math.round(estimatedFreight * ADVANCE_RATIO) : 0,
    insurancePremium,
    overBudget: intent.budgetCap > 0 && estimatedFreight + insurancePremium > intent.budgetCap,
  };

  return { ...partial, operatorSteps: buildOperatorSteps(intent, partial) };
};

export const nextMonthWindow = (): { start: string; end: string } => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59);
  return { start: start.toISOString(), end: end.toISOString() };
};
