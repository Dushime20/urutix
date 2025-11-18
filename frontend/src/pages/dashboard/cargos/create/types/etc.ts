export interface ICarrierPreferences {
  preferredCarriers?: string[];
  excludedCarriers?: string[];
  minCarrierRating?: number;
  maxDistance?: number;
  maxHoursToAvailability?: number;
}

export interface ICostPreferences {
  maxBudget?: number;
  preferredPaymentTerms?: string;
  requiresInsurance?: boolean;
  requiresTracking?: boolean;
}

export interface ILocation {
  id?: string;
  type: string;
  sequence: number;
  locationData: ILocationData;
  scheduledDate: string;
  estimatedTime: number;
  requirements: IRequirements;
  status: string;
  actualArrivalTime?: string;
  actualDepartureTime?: string;
  notes?: string;
}

export interface IContactInfo {
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
}

export interface ILocationData {
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  contactInfo: IContactInfo;
  operatingHours: {};
  specialInstructions?: string;
  accessInstructions: string;
}

export interface IRequirements {
  requiresForklift?: boolean;
  requiresCrane?: boolean;
  requiresLoadingDock?: boolean;
  hazmatCertified: boolean;
  temperatureControlled: boolean;
  securityClearance: string;
}

export interface ITruckRequirements {
  minCapacityWeight?: number;
  minCapacityVolume?: number;
  requiredTruckTypes?: string[];
  requiredFeatures?: string[];
  maxTruckAge?: number;
  minDriverExperience?: number;
  requiredCertifications?: string[];
  minInsuranceCoverage?: number;
}
