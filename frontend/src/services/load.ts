import api from "./api";
import type {
  ICargoBody,
  ICargoResponse,
} from "@/pages/dashboard/cargos/create/types/cargo";
import type {
  ILocation,
  IContactInfo,
} from "@/pages/dashboard/cargos/create/types/etc";

const generateTempId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const ALLOWED_LOAD_TYPES = new Set([
  "FTL",
  "LTL",
  "REEFER",
  "FLATBED",
  "TANKER",
  "INTERMODAL",
  "OTHER",
]);

const ALLOWED_EQUIPMENT_TYPES = new Set([
  "DRY_VAN",
  "REEFER",
  "FLATBED",
  "TANKER",
  "CONTAINER",
  "OTHER",
]);

const ALLOWED_VISIBILITY = new Set(["public", "private"]);

const ALLOWED_PAYMENT_TERMS = new Set([
  "Prepaid",
  "OnDelivery",
  "Net15",
  "Net30",
  "Net45",
  "Net60",
]);

const ALLOWED_PACKAGING_TYPES = new Set([
  "Palletized",
  "Loose",
  "Containerized",
  "Crate",
  "Drum",
  "Other",
]);

const toIsoString = (value?: string) => {
  if (!value) {
    return new Date().toISOString();
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }
  return date.toISOString();
};

const sanitizeContactInfo = (contactInfo?: IContactInfo) => {
  if (!contactInfo) return undefined;
  const cleanedEntries = Object.entries(contactInfo).filter(([_, value]) => {
    if (value === undefined || value === null) return false;
    if (typeof value === "string") {
      return value.trim().length > 0;
    }
    return true;
  });
  if (cleanedEntries.length === 0) return undefined;
  return Object.fromEntries(cleanedEntries);
};

const sanitizeLocations = (locations: ILocation[] = []) => {
  return locations.map((location, index) => {
    const sanitizedLocation: ILocation = {
      ...location,
      id: location.id || generateTempId(index === 0 ? "pickup" : "delivery"),
      sequence: index + 1,
      status: location.status || "PENDING",
      scheduledDate: toIsoString(location.scheduledDate as any),
      estimatedTime: Number(location.estimatedTime) || 60,
      locationData: {
        ...location.locationData,
        coordinates: {
          latitude:
            location.locationData?.coordinates?.latitude !== undefined
              ? Number(location.locationData.coordinates.latitude) || 0
              : 0,
          longitude:
            location.locationData?.coordinates?.longitude !== undefined
              ? Number(location.locationData.coordinates.longitude) || 0
              : 0,
        },
        accessInstructions:
          location.locationData?.accessInstructions?.trim() || undefined,
        specialInstructions:
          location.locationData?.specialInstructions?.trim() || undefined,
      },
      requirements: location.requirements
        ? {
            requiresForklift: !!location.requirements.requiresForklift,
            requiresCrane: !!location.requirements.requiresCrane,
            requiresLoadingDock: !!location.requirements.requiresLoadingDock,
            hazmatCertified: !!location.requirements.hazmatCertified,
            temperatureControlled: !!location.requirements.temperatureControlled,
            securityClearance:
              location.requirements.securityClearance?.trim() || "STANDARD",
          }
        : {
            requiresForklift: false,
            requiresCrane: false,
            requiresLoadingDock: false,
            hazmatCertified: false,
            temperatureControlled: false,
            securityClearance: "STANDARD",
          },
    };

    return sanitizedLocation;
  });
};

const sanitizeCargoPayload = (payload: ICargoBody) => {
  const sanitized: any = {
    ...payload,
  };

  if (!sanitized.pickupLocationId) {
    delete sanitized.pickupLocationId;
  }

  if (!sanitized.deliveryLocationId) {
    delete sanitized.deliveryLocationId;
  }

  sanitized.autoMatchEnabled = sanitized.autoMatchEnabled ?? false;
  sanitized.currencyCode = sanitized.currencyCode || "USD";

  sanitized.loadType = ALLOWED_LOAD_TYPES.has(sanitized.loadType)
    ? sanitized.loadType
    : "FTL";
  sanitized.equipmentType = ALLOWED_EQUIPMENT_TYPES.has(
    sanitized.equipmentType,
  )
    ? sanitized.equipmentType
    : "DRY_VAN";
  sanitized.visibility = ALLOWED_VISIBILITY.has(sanitized.visibility)
    ? sanitized.visibility
    : "public";
  sanitized.unitsRequired = Number(sanitized.unitsRequired) || 1;
  sanitized.paymentTerms = ALLOWED_PAYMENT_TERMS.has(sanitized.paymentTerms)
    ? sanitized.paymentTerms
    : "Net30";

  sanitized.pickupDate = toIsoString(sanitized.pickupDate);
  sanitized.deliveryDate = toIsoString(sanitized.deliveryDate);

  if (
    sanitized.packagingType &&
    !ALLOWED_PACKAGING_TYPES.has(sanitized.packagingType)
  ) {
    sanitized.packagingType = "Other";
  }

  sanitized.locations = sanitizeLocations(sanitized.locations || []);

  const contactInfo = sanitizeContactInfo(sanitized.contactInfo);
  if (contactInfo) {
    sanitized.contactInfo = contactInfo;
  } else {
    delete sanitized.contactInfo;
  }

  if (
    sanitized.matchingCriteria &&
    Object.keys(sanitized.matchingCriteria).length === 0
  ) {
    delete sanitized.matchingCriteria;
  }

  return sanitized;
};

// Loads API
export const loadsAPI = {
  getAll: (params?: any) => api.get("/loads", { params }),
  getById: (id: string) => api.get(`/loads/${id}`),
  create: (data: ICargoBody) =>
    api.post<ICargoResponse>("/loads", sanitizeCargoPayload(data)).then((res) => res.data),
  update: (id: string, data: any) => api.patch(`/loads/${id}`, data),
  delete: (id: string) => api.delete(`/loads/${id}`),
  saveDraft: (data: any) => api.post("/loads/draft", data),

  // Enriched locations from OSM
  getLoadsWithEnrichedLocations: () => api.get("/loads/enriched-locations"),
  getCargoWithEnrichedLocations: (id: string) =>
    api.get(`/loads/${id}/enriched-locations`),
  analyzeCargoRoute: (id: string) => api.get(`/loads/${id}/route-analysis`),
  getLocationSuggestions: (params: any) =>
    api.get("/loads/location-suggestions", { params }),
};
