/**
 * Pure capacity-marketplace rules.
 * A partially loaded truck on any corridor can sell its leftover slice;
 * the platform takes a visible commission on the matched remainder.
 */

export const PLATFORM_CAPACITY_COMMISSION_RATE = 8;
/** How far a pickup/delivery may sit from the truck's great-circle leg (district-scale, worldwide). */
export const CORRIDOR_RADIUS_KM = 100;
/** Extra path length allowed when testing whether a stop lies on the truck leg. */
export const CORRIDOR_DETOUR_TOLERANCE = 0.4;
export const FTL_WEIGHT_KG = 28_000;
export const FTL_VOLUME_M3 = 76;
export const FTL_RATE_PER_KM = 1.85;
export const MIN_FREIGHT = 25;

export type CargoClass =
  | 'GENERAL'
  | 'FRAGILE'
  | 'HAZARDOUS'
  | 'REFRIGERATED'
  | 'LIQUID'
  | 'OVERSIZED'
  | 'VALUABLE';

export type OfferStatus =
  | 'OPEN'
  | 'PARTIALLY_BOOKED'
  | 'FULL'
  | 'IN_TRANSIT'
  | 'COMPLETED'
  | 'EXPIRED'
  | 'CANCELLED';

export type BookingMode = 'INSTANT' | 'REQUEST';

export interface GeoPoint {
  name: string;
  city?: string;
  country?: string;
  countryCode?: string;
  address?: string;
  lat: number;
  lng: number;
}

export interface CapacitySlice {
  remainingWeightKg: number;
  remainingVolumeM3: number;
  allocatedWeightKg: number;
  allocatedVolumeM3: number;
}

export interface OfferMatchInput {
  origin: GeoPoint;
  destination: GeoPoint;
  departureAt: string | Date;
  arrivalAt: string | Date;
  remainingWeightKg: number;
  remainingVolumeM3: number;
  listedWeightKg: number;
  listedVolumeM3: number;
  floorPrice: number;
  pricePerTonne?: number | null;
  pricePerM3?: number | null;
  commissionRate: number;
  compatibleCargoTypes: string[];
  generalCargoOnly: boolean;
  allowMixing: boolean;
  status: OfferStatus;
}

export interface SearchQuery {
  origin?: Partial<GeoPoint> | null;
  destination?: Partial<GeoPoint> | null;
  pickupAt?: string | Date | null;
  weightKg: number;
  volumeM3: number;
  cargoType: CargoClass | string;
  isHazardous?: boolean;
}

export const haversineKm = (aLat: number, aLng: number, bLat: number, bLng: number): number => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

export const roundMoney = (value: number): number => Math.round((Number(value) || 0) * 100) / 100;

export const roundKg = (value: number): number => Math.round((Number(value) || 0) * 100) / 100;

export const utilizationPercent = (allocatedKg: number, nameplateKg: number): number => {
  const cap = Number(nameplateKg) || 0;
  if (cap <= 0) return 0;
  return Math.min(100, Math.round(((Number(allocatedKg) || 0) / cap) * 1000) / 10);
};

export const remainingFromTrip = (
  nameplateKg: number,
  nameplateM3: number,
  alreadyAllocatedKg: number,
  alreadyAllocatedM3: number,
): CapacitySlice => {
  const remainingWeightKg = Math.max(0, roundKg(nameplateKg - alreadyAllocatedKg));
  const remainingVolumeM3 = Math.max(0, roundKg(nameplateM3 - alreadyAllocatedM3));
  return {
    remainingWeightKg,
    remainingVolumeM3,
    allocatedWeightKg: roundKg(alreadyAllocatedKg),
    allocatedVolumeM3: roundKg(alreadyAllocatedM3),
  };
};

/** Leftover marketplace: partial load on an active trip — not empty trucks or full trucks. */
export const isLeftoverSellableSlice = (input: {
  tripId?: string | null;
  allocatedWeightKg: number;
  remainingWeightKg: number;
  utilizationPercent: number;
  existingOfferId?: string | null;
}): boolean =>
  Boolean(input.tripId) &&
  !input.existingOfferId &&
  input.allocatedWeightKg > 0 &&
  input.remainingWeightKg >= 50 &&
  input.utilizationPercent > 0 &&
  input.utilizationPercent < 100;

const cityKey = (point?: Partial<GeoPoint> | null): string =>
  `${(point?.city || point?.name || '').trim().toLowerCase()}|${(point?.countryCode || point?.country || '')
    .trim()
    .toLowerCase()}`;

export const pointsMatch = (
  offerPoint: Partial<GeoPoint> | null | undefined,
  queryPoint: Partial<GeoPoint> | null | undefined,
  radiusKm = CORRIDOR_RADIUS_KM,
): boolean => {
  if (!offerPoint || !queryPoint) return false;
  const offerName = (offerPoint.city || offerPoint.name || '').trim().toLowerCase();
  const queryName = (queryPoint.city || queryPoint.name || '').trim().toLowerCase();
  if (offerName && queryName && (offerName === queryName || offerName.includes(queryName) || queryName.includes(offerName))) {
    return true;
  }
  if (
    typeof offerPoint.lat === 'number' &&
    typeof offerPoint.lng === 'number' &&
    typeof queryPoint.lat === 'number' &&
    typeof queryPoint.lng === 'number' &&
    Number.isFinite(offerPoint.lat) &&
    Number.isFinite(offerPoint.lng) &&
    Number.isFinite(queryPoint.lat) &&
    Number.isFinite(queryPoint.lng)
  ) {
    return haversineKm(offerPoint.lat, offerPoint.lng, queryPoint.lat, queryPoint.lng) <= radiusKm;
  }
  return cityKey(offerPoint) === cityKey(queryPoint) && Boolean(offerName);
};

const hasCoords = (point?: Partial<GeoPoint> | null): point is Partial<GeoPoint> & { lat: number; lng: number } =>
  typeof point?.lat === 'number' &&
  typeof point?.lng === 'number' &&
  Number.isFinite(point.lat) &&
  Number.isFinite(point.lng) &&
  !(point.lat === 0 && point.lng === 0);

/**
 * True when `point` lies on (or near) the great-circle leg origin→destination.
 * Uses distance-to-segment so intermediate districts worldwide can ride leftover space
 * without matching the truck's exact endpoints (e.g. Kayonza on Nyagatare→Cyangugu).
 */
export const pointOnCorridor = (
  origin: Partial<GeoPoint> | null | undefined,
  destination: Partial<GeoPoint> | null | undefined,
  point: Partial<GeoPoint> | null | undefined,
  radiusKm = CORRIDOR_RADIUS_KM,
): boolean => {
  if (!point) return false;
  if (pointsMatch(origin, point) || pointsMatch(destination, point)) return true;
  if (!hasCoords(origin) || !hasCoords(destination) || !hasCoords(point)) return false;

  const t = progressAlongCorridor(origin, destination, point);
  if (t == null || t < -0.05 || t > 1.05) return false;

  const clamped = Math.min(1, Math.max(0, t));
  const projLat = origin.lat + (destination.lat - origin.lat) * clamped;
  const projLng = origin.lng + (destination.lng - origin.lng) * clamped;
  const offRouteKm = haversineKm(point.lat, point.lng, projLat, projLng);
  if (offRouteKm <= radiusKm) return true;

  // Slightly wider band when the stop barely increases total path length (road curves).
  const direct = haversineKm(origin.lat, origin.lng, destination.lat, destination.lng);
  if (direct <= 0.5) return false;
  const via =
    haversineKm(origin.lat, origin.lng, point.lat, point.lng) +
    haversineKm(point.lat, point.lng, destination.lat, destination.lng);
  return via <= direct * (1 + CORRIDOR_DETOUR_TOLERANCE) && offRouteKm <= radiusKm * 1.25;
};

/** 0 at truck origin → 1 at truck destination; null if coords missing. */
export const progressAlongCorridor = (
  origin: Partial<GeoPoint> | null | undefined,
  destination: Partial<GeoPoint> | null | undefined,
  point: Partial<GeoPoint> | null | undefined,
): number | null => {
  if (!hasCoords(origin) || !hasCoords(destination) || !hasCoords(point)) return null;
  const dx = destination.lng - origin.lng;
  const dy = destination.lat - origin.lat;
  const len2 = dx * dx + dy * dy;
  if (len2 < 1e-12) return 0;
  return ((point.lng - origin.lng) * dx + (point.lat - origin.lat) * dy) / len2;
};

/**
 * Leftover space matches when cargo pickup/delivery sit on the truck's working route
 * in the same travel direction — not only when cities equal the trip endpoints.
 * Example: truck Nyagatare→Cyangugu can take Kayonza→Nyamagabe if both stops are on that corridor.
 */
export const corridorOverlaps = (
  offer: Pick<OfferMatchInput, 'origin' | 'destination'>,
  query: Pick<SearchQuery, 'origin' | 'destination'>,
): boolean => {
  if (!query.origin && !query.destination) return true;

  // Exact / near endpoint match still wins (same cities as listed leg).
  const exactOrigin = !query.origin || pointsMatch(offer.origin, query.origin);
  const exactDest = !query.destination || pointsMatch(offer.destination, query.destination);
  if (exactOrigin && exactDest) return true;

  const pickupOnRoute = !query.origin || pointOnCorridor(offer.origin, offer.destination, query.origin);
  const deliveryOnRoute =
    !query.destination || pointOnCorridor(offer.origin, offer.destination, query.destination);

  if (!pickupOnRoute || !deliveryOnRoute) return false;

  // Same direction: pickup must occur before delivery along the truck leg.
  if (query.origin && query.destination) {
    const pickupT = progressAlongCorridor(offer.origin, offer.destination, query.origin);
    const deliveryT = progressAlongCorridor(offer.origin, offer.destination, query.destination);
    if (pickupT != null && deliveryT != null && pickupT > deliveryT + 0.02) return false;
  }

  return true;
};

export const windowsOverlap = (
  departureAt: string | Date,
  arrivalAt: string | Date,
  pickupAt?: string | Date | null,
): boolean => {
  if (!pickupAt) return true;
  const pickup = new Date(pickupAt).getTime();
  const start = new Date(departureAt).getTime() - 12 * 60 * 60 * 1000;
  const end = new Date(arrivalAt).getTime() + 12 * 60 * 60 * 1000;
  return pickup >= start && pickup <= end;
};

const MIX_BLOCK: Record<string, string[]> = {
  HAZARDOUS: ['GENERAL', 'FRAGILE', 'REFRIGERATED', 'LIQUID', 'VALUABLE', 'OVERSIZED'],
  LIQUID: ['FRAGILE', 'REFRIGERATED'],
  REFRIGERATED: ['HAZARDOUS', 'LIQUID'],
};

export const cargoAllowedOnOffer = (
  offer: Pick<OfferMatchInput, 'compatibleCargoTypes' | 'generalCargoOnly' | 'allowMixing'>,
  cargoType: string,
  isHazardous = false,
): boolean => {
  const type = (cargoType || 'GENERAL').toUpperCase();
  if (isHazardous || type === 'HAZARDOUS') {
    if (offer.generalCargoOnly) return false;
    return (offer.compatibleCargoTypes || []).map((t) => t.toUpperCase()).includes('HAZARDOUS');
  }
  if (offer.generalCargoOnly && !['GENERAL', 'FRAGILE', 'VALUABLE'].includes(type)) {
    return false;
  }
  const allowed = (offer.compatibleCargoTypes || []).map((t) => t.toUpperCase());
  if (allowed.length && !allowed.includes(type)) return false;
  if (!offer.allowMixing) return allowed.length <= 1 || allowed.includes(type);
  for (const existing of allowed) {
    if (MIX_BLOCK[existing]?.includes(type) || MIX_BLOCK[type]?.includes(existing)) return false;
  }
  return true;
};

export const fitsRemaining = (
  remainingWeightKg: number,
  remainingVolumeM3: number,
  weightKg: number,
  volumeM3: number,
): boolean => weightKg > 0 && weightKg <= remainingWeightKg + 0.01 && (volumeM3 || 0) <= remainingVolumeM3 + 0.01;

export const nextOfferStatus = (
  remainingWeightKg: number,
  _remainingVolumeM3: number,
  current: OfferStatus,
): OfferStatus => {
  if (['CANCELLED', 'EXPIRED', 'COMPLETED', 'IN_TRANSIT'].includes(current)) return current;
  if (remainingWeightKg <= 0.5) return 'FULL';
  if (current === 'OPEN' || current === 'FULL') return 'PARTIALLY_BOOKED';
  return current;
};

export const applyBookingToSlice = (
  slice: CapacitySlice,
  weightKg: number,
  volumeM3: number,
  direction: 'reserve' | 'release',
): CapacitySlice => {
  const sign = direction === 'reserve' ? 1 : -1;
  const allocatedWeightKg = roundKg(slice.allocatedWeightKg + sign * weightKg);
  const allocatedVolumeM3 = roundKg(slice.allocatedVolumeM3 + sign * volumeM3);
  return {
    allocatedWeightKg: Math.max(0, allocatedWeightKg),
    allocatedVolumeM3: Math.max(0, allocatedVolumeM3),
    remainingWeightKg: roundKg(slice.remainingWeightKg - sign * weightKg),
    remainingVolumeM3: roundKg(slice.remainingVolumeM3 - sign * volumeM3),
  };
};

export const quoteFreight = (
  offer: Pick<
    OfferMatchInput,
    'origin' | 'destination' | 'floorPrice' | 'pricePerTonne' | 'pricePerM3' | 'listedWeightKg' | 'listedVolumeM3'
  >,
  weightKg: number,
  volumeM3: number,
): number => {
  const tonnes = weightKg / 1000;
  if (Number(offer.pricePerTonne) > 0) {
    return roundMoney(Math.max(MIN_FREIGHT, tonnes * Number(offer.pricePerTonne)));
  }
  if (Number(offer.pricePerM3) > 0 && volumeM3 > 0) {
    return roundMoney(Math.max(MIN_FREIGHT, volumeM3 * Number(offer.pricePerM3)));
  }
  const listed = Number(offer.listedWeightKg) || weightKg;
  if (Number(offer.floorPrice) > 0 && listed > 0) {
    return roundMoney(Math.max(MIN_FREIGHT, Number(offer.floorPrice) * (weightKg / listed)));
  }
  const distance = haversineKm(offer.origin.lat, offer.origin.lng, offer.destination.lat, offer.destination.lng);
  const share = weightKg / FTL_WEIGHT_KG;
  return roundMoney(Math.max(MIN_FREIGHT, distance * FTL_RATE_PER_KM * Math.max(share, 0.05)));
};

export const quoteCommission = (freightAmount: number, commissionRate = PLATFORM_CAPACITY_COMMISSION_RATE) => {
  const rate = Number(commissionRate) || PLATFORM_CAPACITY_COMMISSION_RATE;
  const amount = roundMoney((freightAmount * rate) / 100);
  return { rate, amount, payer: 'CARGO_OWNER' as const };
};

export const bookableStatuses: OfferStatus[] = ['OPEN', 'PARTIALLY_BOOKED'];

export function hardFilterOffer(offer: OfferMatchInput, query: SearchQuery): string | null {
  if (!bookableStatuses.includes(offer.status)) return `Offer is ${offer.status.toLowerCase().replace('_', ' ')}`;
  if (!corridorOverlaps(offer, query)) {
    return 'Cargo pickup/delivery are not on this truck working route';
  }
  if (!windowsOverlap(offer.departureAt, offer.arrivalAt, query.pickupAt)) {
    return 'Pickup window does not overlap the truck departure';
  }
  if (!cargoAllowedOnOffer(offer, query.cargoType, query.isHazardous)) {
    return 'Cargo type is not allowed on this shared truck';
  }
  if (!fitsRemaining(offer.remainingWeightKg, offer.remainingVolumeM3, query.weightKg, query.volumeM3)) {
    return 'Not enough remaining weight or volume';
  }
  return null;
}

export function scoreOffer(offer: OfferMatchInput, query: SearchQuery): number {
  const reject = hardFilterOffer(offer, query);
  if (reject) return 0;

  const corridorKm = hasCoords(offer.origin) && hasCoords(offer.destination)
    ? haversineKm(offer.origin.lat, offer.origin.lng, offer.destination.lat, offer.destination.lng)
    : 0;

  const offRouteKm = (point?: Partial<GeoPoint> | null) => {
    if (!point || !hasCoords(offer.origin) || !hasCoords(offer.destination) || !hasCoords(point)) return 0;
    if (pointsMatch(offer.origin, point) || pointsMatch(offer.destination, point)) return 0;
    const t = progressAlongCorridor(offer.origin, offer.destination, point) ?? 0;
    const clamped = Math.min(1, Math.max(0, t));
    const projLat = offer.origin.lat + (offer.destination.lat - offer.origin.lat) * clamped;
    const projLng = offer.origin.lng + (offer.destination.lng - offer.origin.lng) * clamped;
    return haversineKm(point.lat, point.lng, projLat, projLng);
  };

  const pickupOff = offRouteKm(query.origin);
  const deliveryOff = offRouteKm(query.destination);
  const detourBudget = Math.max(40, corridorKm * 0.2);
  const routeFit = Math.max(0, 100 - ((pickupOff + deliveryOff) / detourBudget) * 100);

  // Prefer cargo that rides a meaningful share of the truck leg (not tiny hop at the start).
  let spanScore = 70;
  if (query.origin && query.destination) {
    const pickupT = progressAlongCorridor(offer.origin, offer.destination, query.origin);
    const deliveryT = progressAlongCorridor(offer.origin, offer.destination, query.destination);
    if (pickupT != null && deliveryT != null) {
      const span = Math.max(0, deliveryT - pickupT);
      spanScore = Math.round(55 + Math.min(1, span) * 45);
    }
  }

  const fill = Math.min(100, (query.weightKg / Math.max(offer.remainingWeightKg, 1)) * 100);
  const fillScore = fill >= 20 && fill <= 95 ? 100 : fill > 95 ? 70 : 55;
  return Math.round(routeFit * 0.35 + spanScore * 0.2 + fillScore * 0.45);
}

export function suggestListedRemainder(
  nameplateKg: number,
  nameplateM3: number,
  allocatedKg: number,
  allocatedM3: number,
): CapacitySlice {
  const slice = remainingFromTrip(nameplateKg, nameplateM3, allocatedKg, allocatedM3);
  return slice;
}
