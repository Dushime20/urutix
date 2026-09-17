import api from './api';

export interface CapacityPlace {
  name: string;
  city?: string;
  country?: string;
  countryCode?: string;
  address?: string;
  lat?: number;
  lng?: number;
}

export interface CapacityQuote {
  freightAmount: number;
  suggestedFreight?: number;
  offeredPrice?: number | null;
  commissionRate: number;
  commissionAmount: number;
  totalDue: number;
  currencyCode: string;
  payer: 'CARGO_OWNER';
  commissionPayee: 'PLATFORM';
  remainingWeightKg: number;
  remainingVolumeM3: number;
}

export interface CapacityOffer {
  id: string;
  truckId: string;
  tripId?: string | null;
  origin: CapacityPlace;
  destination: CapacityPlace;
  corridor: string;
  departureAt: string;
  arrivalAt: string;
  listedWeightKg: number;
  remainingWeightKg: number;
  remainingVolumeM3: number;
  allocatedWeightKg: number;
  floorPrice: number;
  pricePerTonne?: number | null;
  commissionRate: number;
  bookingMode: 'INSTANT' | 'REQUEST';
  status: string;
  notes?: string | null;
  utilizationOfRemainder: number;
  emptyPercent: number;
  matchScore?: number;
  matchReason?: string | null;
  bookable?: boolean;
  quote?: CapacityQuote | null;
  bookingCount?: number;
  pendingRequests?: number;
  truck?: {
    id: string;
    plateNumber: string;
    make?: string;
    model?: string;
    capacityWeight: number;
    capacityVolume: number;
  } | null;
  bookings?: CapacityBooking[];
}

export interface CapacityBooking {
  id: string;
  offerId: string;
  loadId?: string | null;
  tripId?: string | null;
  weightKg: number;
  volumeM3: number;
  cargoType: string;
  title?: string;
  freightAmount: number;
  offeredPrice?: number;
  commissionRate: number;
  commissionAmount: number;
  totalDue: number;
  currencyCode: string;
  commissionStatus: string;
  status: string;
  corridor?: string | null;
  bookingMode?: string;
  pickupDate?: string;
  deliveryDate?: string;
  pickupLabel?: string | null;
  deliveryLabel?: string | null;
  origin?: CapacityPlace | null;
  destination?: CapacityPlace | null;
  createdAt: string;
}

export interface AssignableCargo {
  id: string;
  title: string;
  weightKg: number;
  volumeM3: number;
  cargoType: string;
  status: string;
  pickupDate?: string | null;
  deliveryDate?: string | null;
  origin?: CapacityPlace | null;
  destination?: CapacityPlace | null;
  corridor: string;
}

export interface SellableTruck {
  truckId: string;
  plateNumber: string;
  make?: string;
  model?: string;
  status: string;
  nameplateWeightKg: number;
  nameplateVolumeM3: number;
  tripId?: string | null;
  tripNumber?: string | null;
  cargoTitle?: string | null;
  loadedWeightKg?: number;
  corridor?: {
    origin: CapacityPlace;
    destination: CapacityPlace;
    departureAt: string;
    arrivalAt: string;
  } | null;
  remainingWeightKg: number;
  remainingVolumeM3: number;
  utilizationPercent: number;
  emptyPercent: number;
  canList: boolean;
  existingOfferId?: string | null;
  suggestedFloorPrice: number;
}

export interface CreateOfferPayload {
  truckId: string;
  tripId: string;
  floorPrice?: number;
  bookingMode?: 'INSTANT' | 'REQUEST';
}

const unwrap = <T>(payload: any): T => {
  if (Array.isArray(payload)) return payload as T;
  if (payload?.data && (payload.data.id || Array.isArray(payload.data) || payload.data.truckId)) {
    return payload.data as T;
  }
  return payload as T;
};

const compactParams = (params: Record<string, any>) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  );

export const capacityApi = {
  searchCities: (q: string) =>
    api.get('/capacity/cities', { params: { q } }).then((r) => {
      const data = unwrap<any[]>(r.data);
      return Array.isArray(data) ? data : [];
    }),
  sellable: () =>
    api.get('/capacity/sellable').then((r) => {
      const data = unwrap<SellableTruck[]>(r.data);
      return Array.isArray(data) ? data : [];
    }),
  stats: () => api.get('/capacity/stats').then((r) => unwrap(r.data)),
  listOffers: () =>
    api.get('/capacity/offers').then((r) => {
      const data = unwrap<CapacityOffer[]>(r.data);
      return Array.isArray(data) ? data : [];
    }),
  getOffer: (id: string) => api.get(`/capacity/offers/${id}`).then((r) => unwrap<CapacityOffer>(r.data)),
  createOffer: (payload: CreateOfferPayload) =>
    api.post('/capacity/offers', payload).then((r) => unwrap<CapacityOffer>(r.data)),
  updateOffer: (id: string, payload: Partial<CreateOfferPayload>) =>
    api.patch(`/capacity/offers/${id}`, payload).then((r) => unwrap<CapacityOffer>(r.data)),
  closeOffer: (id: string) => api.post(`/capacity/offers/${id}/close`).then((r) => unwrap(r.data)),
  marketplace: (params: Record<string, any>) =>
    api.get('/capacity/marketplace', { params: compactParams(params) }).then((r) => {
      const data = unwrap<CapacityOffer[]>(r.data);
      return Array.isArray(data) ? data : [];
    }),
  quote: (
    offerId: string,
    payload: {
      weightKg: number;
      volumeM3?: number;
      cargoType?: string;
      offeredPrice?: number;
      origin?: CapacityPlace | null;
      destination?: CapacityPlace | null;
      pickupAt?: string;
    },
  ) =>
    api
      .post(`/capacity/offers/${offerId}/quote`, compactParams(payload))
      .then((r) => unwrap<CapacityQuote>(r.data)),
  assignableCargos: () =>
    api.get('/capacity/assignable-cargos').then((r) => {
      const data = unwrap<AssignableCargo[]>(r.data);
      return Array.isArray(data) ? data : [];
    }),
  book: (offerId: string, payload: Record<string, any>) =>
    api.post(`/capacity/offers/${offerId}/book`, payload).then((r) => unwrap<CapacityBooking>(r.data)),
  bookings: () =>
    api.get('/capacity/bookings').then((r) => {
      const data = unwrap<CapacityBooking[]>(r.data);
      return Array.isArray(data) ? data : [];
    }),
  accept: (id: string) => api.post(`/capacity/bookings/${id}/accept`).then((r) => unwrap(r.data)),
  reject: (id: string, reason?: string) =>
    api.post(`/capacity/bookings/${id}/reject`, { reason }).then((r) => unwrap(r.data)),
  cancel: (id: string, reason?: string) =>
    api.post(`/capacity/bookings/${id}/cancel`, { reason }).then((r) => unwrap(r.data)),
};
