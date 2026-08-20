export type CampaignStatus =
  | 'DRAFT'
  | 'PLANNED'
  | 'APPROVED'
  | 'EXECUTING'
  | 'COMPLETE'
  | 'EXCEPTION';

export type OperatorLayer = 'C' | 'D';

export type OperatorStepStatus = 'ready' | 'planned' | 'queued' | 'partner';

export interface CorridorCity {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
}

export interface CampaignIntent {
  productName: string;
  totalUnits: number;
  kgPerUnit: number;
  m3PerUnit: number;
  valuePerUnit: number;
  originCityId: string;
  destinationCityIds: string[];
  windowStart: string;
  windowEnd: string;
  budgetCap: number;
  slaPercent: number;
  preferSharedTrucks: boolean;
  requireInsurance: boolean;
  fundOnEscrow: boolean;
  goodsReady: boolean;
  currencyCode: string;
}

export interface PlannedDestination {
  cityId: string;
  cityName: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
  units: number;
  weightKg: number;
  volumeM3: number;
  distanceKm: number;
  loadType: 'FTL' | 'LTL';
  estimatedFreight: number;
  pickupDate: string;
  deliveryDate: string;
  crossBorder: boolean;
  loadId?: string;
  loadStatus?: string;
}

export interface OperatorStep {
  id: string;
  label: string;
  detail: string;
  layer: OperatorLayer;
  status: OperatorStepStatus;
}

export interface CampaignPlan {
  destinations: PlannedDestination[];
  totalWeightKg: number;
  totalVolumeM3: number;
  ftlCount: number;
  ltlCount: number;
  sharedCapacityPct: number;
  estimatedFreight: number;
  estimatedAdvance: number;
  insurancePremium: number;
  overBudget: boolean;
  operatorSteps: OperatorStep[];
}

export interface DistributionCampaign {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: CampaignStatus;
  intent: CampaignIntent;
  plan: CampaignPlan | null;
  loadIds: string[];
  approvedAt?: string;
}

export const FTL_WEIGHT_KG = 28_000;
export const FTL_VOLUME_M3 = 76;
export const FTL_RATE_PER_KM = 1.85;
export const ADVANCE_RATIO = 0.7;
export const INSURANCE_RATE = 0.0045;
