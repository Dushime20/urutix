import type {
  ICarrierPreferences,
  IContactInfo,
  ICostPreferences,
  ILocation,
  ITruckRequirements,
} from "./etc";

export interface ICargoBody {
  title: string;
  description: string;
  weight: number;
  volume: number;
  cargoType: string;
  loadType: string;
  equipmentType: string;
  visibility: string;
  unitsRequired: number;
  locations: ILocation[];
  pickupDate: string;
  deliveryDate: string;
  loadValue: number;
  offeredPrice: number;
  currencyCode: string;
  paymentTerms: string;
  isFragile: boolean;
  isHazardous: boolean;
  requiresRefrigeration: boolean;
  contactInfo: IContactInfo;
  autoMatchEnabled: boolean;
  matchingCriteria: {};
  length: number;
  width: number;
  height: number;
  stackableHeight: number;
  isStackable: boolean;
  temperatureMin: number;
  temperatureMax: number;
  requiresHumidityControl: boolean;
  requiresForklift: boolean;
  requiresCrane: boolean;
  requiresLoadingDock: boolean;
  loadingTimeEstimate: number;
  unloadingTimeEstimate: number;
  hazmatClass: string;
  hazmatNumber: string;
  urgencyLevel: string;
  isTimeCritical: boolean;
  maxTransitTime: number;
  packagingType: string;
  numberOfPieces: number;
  numberOfPallets: number;
  requiresGpsMonitoring: boolean;
  requiresTemperatureMonitoring: boolean;
  insuranceValue: number;
  requiresLowClearanceRoute: boolean;
  maxClearanceHeight: number;
  requiresEscortVehicle: boolean;
  specialHandlingInstructions: string;
  loadingInstructions: string;
  unloadingInstructions: string;
  emergencyContactInfo: string;
  truckRequirements?: ITruckRequirements;
  carrierPreferences?: ICarrierPreferences;
  costPreferences?: ICostPreferences;
  requiresPreShipmentInspection: boolean;
  requiresDeliveryInspection: boolean;
  requiresPhotographicDocumentation: boolean;
}

export interface ICargoResponse {
  id: string;
  title: string;
  description: string;
  weight: number;
  volume: number;
  cargoType: string;
  status: string;
  loadValue: number;
  offeredPrice: number;
  currencyCode: string;
  pickupDate: Date;
  deliveryDate: Date;
  urgencyLevel: string;
  isTimeCritical: boolean;
  isFragile: boolean;
  isHazardous: boolean;
  requiresRefrigeration: boolean;
  length: number;
  width: number;
  height: number;
  requiresGpsMonitoring: boolean;
  requiresTemperatureMonitoring: boolean;
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  cargoOwner: IContactInfo;
  pickupLocation: ILocation;
  deliveryLocation: ILocation;
  receiverId?: string;
  receiver?: {
    id: string;
    email: string;
    profile?: {
      firstName?: string;
      lastName?: string;
    };
  };
}

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
  // Contact info fields
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
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
  truckRequirements?: ITruckRequirements;
  carrierPreferences?: ICarrierPreferences;
  costPreferences?: ICostPreferences;
  requiresPreShipmentInspection?: boolean;
  requiresDeliveryInspection?: boolean;
  requiresPhotographicDocumentation?: boolean;
  documents?: any[];
}
