import api from './api';

export interface DraftCargoData {
  title?: string;
  description?: string;
  weight?: number;
  volume?: number;
  cargoType?: string;
  loadType?: string;
  equipmentType?: string;
  urgencyLevel?: string;
  isTimeCritical?: boolean;
  isFragile?: boolean;
  isHazardous?: boolean;
  requiresRefrigeration?: boolean;
  length?: number;
  width?: number;
  height?: number;
  pickupDate?: string;
  deliveryDate?: string;
  locations?: Array<{
    type: 'PICKUP' | 'DELIVERY' | 'STOP';
    sequence: number;
    locationData: {
      name: string;
      address: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
      coordinates: {
        latitude: number;
        longitude: number;
      };
      contactInfo?: {
        contactPerson?: string;
        contactPhone?: string;
        contactEmail?: string;
      };
      operatingHours?: Record<string, any>;
      specialInstructions?: string;
      accessInstructions?: string;
    };
    scheduledDate: string;
    estimatedTime: number;
    requirements?: {
      requiresForklift?: boolean;
      requiresCrane?: boolean;
      requiresLoadingDock?: boolean;
      hazmatCertified?: boolean;
      temperatureControlled?: boolean;
      securityClearance?: string;
    };
    status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    actualArrivalTime?: string;
    actualDepartureTime?: string;
    notes?: string;
  }>;
  loadValue?: number;
  offeredPrice?: number;
  currencyCode?: string;
  unitsRequired?: number;
  paymentTerms?: string;
  packagingType?: string;
  contactInfo?: Record<string, any>;
  autoMatchEnabled?: boolean;
  matchingCriteria?: Record<string, any>;
  truckRequirements?: Record<string, any>;
  carrierPreferences?: Record<string, any>;
  costPreferences?: Record<string, any>;
  isStackable?: boolean;
  requiresHumidityControl?: boolean;
  requiresForklift?: boolean;
  requiresCrane?: boolean;
  requiresLoadingDock?: boolean;
  requiresGpsMonitoring?: boolean;
  requiresTemperatureMonitoring?: boolean;
  requiresLowClearanceRoute?: boolean;
  requiresEscortVehicle?: boolean;
  requiresPreShipmentInspection?: boolean;
  requiresDeliveryInspection?: boolean;
  requiresPhotographicDocumentation?: boolean;
  numberOfPieces?: number;
  numberOfPallets?: number;
  temperatureMin?: number;
  temperatureMax?: number;
  hazmatClass?: string;
  hazmatNumber?: string;
  loadingTimeEstimate?: number;
  unloadingTimeEstimate?: number;
  loadingInstructions?: string;
  unloadingInstructions?: string;
  insuranceValue?: number;
  emergencyContactInfo?: Record<string, any>;
  maxClearanceHeight?: number;
  maxTransitTime?: number;
  specialHandlingInstructions?: string;
}

export interface DraftCargoResponse {
  id: string;
  title: string;
  description: string;
  weight: number;
  volume: number;
  cargoType: string;
  status: string;
  loadValue?: number;
  offeredPrice?: number;
  currencyCode?: string;
  pickupDate?: string;
  deliveryDate?: string;
  urgencyLevel: string;
  isTimeCritical: boolean;
  isFragile: boolean;
  isHazardous: boolean;
  requiresRefrigeration: boolean;
  length?: number;
  width?: number;
  height?: number;
  requiresGpsMonitoring: boolean;
  requiresTemperatureMonitoring: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  cargoOwner?: {
    id: string;
    email: string;
    profile?: Record<string, any>;
  };
  pickupLocation?: {
    id: string;
    name: string;
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  deliveryLocation?: {
    id: string;
    name: string;
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
}

export interface DraftsPaginatedResponse {
  items: DraftCargoResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

class DraftCargoApi {
  private baseUrl = '/loads';

  /**
   * Save cargo as draft
   */
  async saveAsDraft(data: DraftCargoData): Promise<{ message: string; load: DraftCargoResponse }> {
    const response = await api.post(`${this.baseUrl}/draft`, data);
    return response.data;
  }

  /**
   * Update existing draft cargo
   */
  async updateDraft(id: string, data: Partial<DraftCargoData>): Promise<{ message: string; load: DraftCargoResponse }> {
    const response = await api.patch(`${this.baseUrl}/draft/${id}`, data);
    return response.data;
  }

  /**
   * Get user's draft cargo with pagination
   */
  async getUserDrafts(page: number = 1, limit: number = 20): Promise<DraftsPaginatedResponse> {
    const response = await api.get(`${this.baseUrl}/drafts`, {
      params: { page, limit }
    });
    return response.data;
  }

  /**
   * Move draft cargo to created status (ready for matching/publishing)
   */
  async publishDraft(id: string): Promise<{ message: string; load: DraftCargoResponse }> {
    const response = await api.post(`${this.baseUrl}/draft/${id}/publish`);
    return response.data;
  }

  /**
   * Delete draft cargo
   */
  async deleteDraft(id: string): Promise<{ message: string }> {
    const response = await api.delete(`${this.baseUrl}/draft/${id}`);
    return response.data;
  }

  /**
   * Get a single draft cargo by ID
   */
  async getDraftById(id: string): Promise<DraftCargoResponse> {
    const response = await api.get(`${this.baseUrl}/${id}`);
    return response.data.load;
  }
}

export const draftCargoApi = new DraftCargoApi();
export default draftCargoApi;
