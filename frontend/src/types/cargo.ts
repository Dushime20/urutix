// Enhanced Cargo interface that matches backend data structure with all new fields
export interface Cargo {
  id: string;
  title: string;
  description?: string;
  weight: number;
  volume?: number;
  cargoType: string;
  pickupLocationId: string;
  deliveryLocationId: string;
  pickupDate: string;
  deliveryDate: string;
  status: string;
  loadValue: number;
  offeredPrice?: number;
  currencyCode: string;
  isFragile: boolean;
  isHazardous: boolean;
  requiresRefrigeration: boolean;
  contactInfo: Record<string, any>;
  autoMatchEnabled: boolean;
  matchingCriteria: Record<string, any>;
  publishedAt?: string;
  assignedTruckId?: string;
  rating: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;

  // Enhanced cargo fields - Dimensional specifications
  length?: number;
  width?: number;
  height?: number;
  stackableHeight?: number;
  isStackable?: boolean;

  // Temperature & Environmental requirements
  temperatureMin?: number;
  temperatureMax?: number;
  requiresHumidityControl?: boolean;

  // Loading & Unloading requirements
  requiresForklift?: boolean;
  requiresCrane?: boolean;
  requiresLoadingDock?: boolean;
  loadingTimeEstimate?: number;
  unloadingTimeEstimate?: number;

  // Hazmat & Regulatory compliance
  hazmatClass?: string;
  hazmatNumber?: string;

  // Urgency & Time sensitivity
  urgencyLevel?: "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
  isTimeCritical?: boolean;
  maxTransitTime?: number;

  // Packaging & Handling details
  packagingType?: string;
  numberOfPieces?: number;
  numberOfPallets?: number;

  // Security & Insurance requirements
  requiresGpsMonitoring?: boolean;
  requiresTemperatureMonitoring?: boolean;
  insuranceValue?: number;

  // Route & Access requirements
  requiresLowClearanceRoute?: boolean;
  maxClearanceHeight?: number;
  requiresEscortVehicle?: boolean;

  // Special handling instructions
  specialHandlingInstructions?: string;
  loadingInstructions?: string;
  unloadingInstructions?: string;
  emergencyContactInfo?: string;

  // Advanced matching criteria
  truckRequirements?: {
    minCapacityWeight?: number;
    minCapacityVolume?: number;
    requiredTruckTypes?: string[];
    requiredFeatures?: string[];
    maxTruckAge?: number;
    minDriverExperience?: number;
    requiredCertifications?: string[];
    minInsuranceCoverage?: number;
  };
  carrierPreferences?: {
    preferredCarriers?: string[];
    excludedCarriers?: string[];
    minCarrierRating?: number;
    maxDistance?: number;
    maxHoursToAvailability?: number;
  };
  costPreferences?: {
    maxBudget?: number;
    preferredPaymentTerms?: string;
    requiresInsurance?: boolean;
    requiresTracking?: boolean;
  };

  // Quality & Inspection requirements
  requiresPreShipmentInspection?: boolean;
  requiresDeliveryInspection?: boolean;
  requiresPhotographicDocumentation?: boolean;

  // Relations from backend
  cargoOwner?: {
    id: string;
    email: string;
    profile?: {
      firstName: string;
      lastName: string;
      companyName: string;
    };
  };
  broker?: {
    id: string;
    email: string;
    profile?: {
      firstName?: string;
      lastName?: string;
      companyName?: string;
    };
  };
  brokerId?: string;
  brokerCommissionRate?: number;
  brokerCommissionAmount?: number;
  pickupLocation?: {
    id: string;
    name: string;
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    locationType: string;
  };
  deliveryLocation?: {
    id: string;
    name: string;
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    locationType: string;
  };
}

export interface CargoFilters {
  status?: string;
  origin?: string;
  destination?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  urgencyLevel?: string;
  cargoType?: string;
  isHazardous?: boolean;
  requiresRefrigeration?: boolean;
  isTimeCritical?: boolean;
}

export interface CargoData {
  items: Cargo[];
  hasMore: boolean;
  total: number;
}

// Enhanced cargo form data interface
export interface CargoFormData {
  title: string;
  description?: string;
  weight: number;
  volume?: number;
  cargoType: string;
  loadType: string;
  equipmentType: string;
  visibility: string;
  unitsRequired: number;
  pickupLocationId: string;
  deliveryLocationId: string;
  pickupDate: string;
  deliveryDate: string;
  loadValue: number;
  offeredPrice?: number;
  currencyCode: string;
  paymentTerms: string;
  isFragile: boolean;
  isHazardous: boolean;
  requiresRefrigeration: boolean;
  specialRequirements?: string;
  autoMatchEnabled: boolean;
  loadingInstructions?: string;
  unloadingInstructions?: string;

  // Enhanced fields
  length?: number;
  width?: number;
  height?: number;
  stackableHeight?: number;
  isStackable?: boolean;
  temperatureMin?: number;
  temperatureMax?: number;
  requiresHumidityControl?: boolean;
  requiresForklift?: boolean;
  requiresCrane?: boolean;
  requiresLoadingDock?: boolean;
  loadingTimeEstimate?: number;
  unloadingTimeEstimate?: number;
  hazmatClass?: string;
  hazmatNumber?: string;
  urgencyLevel?: "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
  isTimeCritical?: boolean;
  maxTransitTime?: number;
  packagingType?: string;
  numberOfPieces?: number;
  numberOfPallets?: number;
  requiresGpsMonitoring?: boolean;
  requiresTemperatureMonitoring?: boolean;
  insuranceValue?: number;
  requiresLowClearanceRoute?: boolean;
  maxClearanceHeight?: number;
  requiresEscortVehicle?: boolean;
  specialHandlingInstructions?: string;
  emergencyContactInfo?: string;
  truckRequirements?: {
    minCapacityWeight?: number;
    minCapacityVolume?: number;
    requiredTruckTypes?: string[];
    requiredFeatures?: string[];
    maxTruckAge?: number;
    minDriverExperience?: number;
    requiredCertifications?: string[];
    minInsuranceCoverage?: number;
  };
  carrierPreferences?: {
    preferredCarriers?: string[];
    excludedCarriers?: string[];
    minCarrierRating?: number;
    maxDistance?: number;
    maxHoursToAvailability?: number;
  };
  costPreferences?: {
    maxBudget?: number;
    preferredPaymentTerms?: string;
    requiresInsurance?: boolean;
    requiresTracking?: boolean;
  };
  requiresPreShipmentInspection?: boolean;
  requiresDeliveryInspection?: boolean;
  requiresPhotographicDocumentation?: boolean;
  documents?: any[]; // Using any[] temporarily, should be Document[]
}
