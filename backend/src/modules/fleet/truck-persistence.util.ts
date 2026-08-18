/**
 * Helpers to persist nested Create Vehicle form fields that live in JSONB
 * (insurance status, issuing authority, cargo capabilities, etc.).
 */

const TRANSIENT_DOC_KEYS = new Set(['file', 'previewUrl']);

function stripTransient(value: any): any {
  if (Array.isArray(value)) {
    return value.map(stripTransient);
  }
  if (value && typeof value === 'object') {
    const next: Record<string, any> = {};
    Object.entries(value).forEach(([key, nested]) => {
      if (TRANSIENT_DOC_KEYS.has(key) || nested === undefined) return;
      next[key] = stripTransient(nested);
    });
    return next;
  }
  return value;
}

export function sanitizeComplianceDocuments(
  docs?: Record<string, any> | null,
): Record<string, any> {
  if (!docs || typeof docs !== 'object') return {};
  return stripTransient(docs);
}

export function insuranceAlertFromCompliance(
  docs?: Record<string, any> | null,
  userId?: string,
): Record<string, any> | null {
  const insurance = docs?.insurance;
  if (!insurance || typeof insurance !== 'object') return null;
  if (
    !insurance.number &&
    !insurance.status &&
    !insurance.expiryDate &&
    !insurance.issuingAuthority
  ) {
    return null;
  }

  return {
    id: 'ins-vehicle-form',
    policyNumber: insurance.number || '',
    status: insurance.status || 'VALID',
    issuingAuthority: insurance.issuingAuthority || '',
    issueDate: insurance.issueDate || null,
    expiryDate: insurance.expiryDate || null,
    startDate: insurance.issueDate || null,
    endDate: insurance.expiryDate || null,
    source: 'vehicle_form',
    updatedAt: new Date(),
    ...(userId ? { updatedBy: userId } : {}),
  };
}

export function mergeInsuranceAlerts(
  existing: any[] | undefined,
  docs?: Record<string, any> | null,
  userId?: string,
): any[] {
  const fromForm = insuranceAlertFromCompliance(docs, userId);
  const current = Array.isArray(existing) ? existing.filter(Boolean) : [];
  if (!fromForm) return current;

  const withoutForm = current.filter(
    (item) => item?.id !== 'ins-vehicle-form' && item?.source !== 'vehicle_form',
  );
  return [fromForm, ...withoutForm];
}

export function availabilityForStatus(
  status?: string,
  availabilityStatus?: string,
): string | undefined {
  if (status === 'MAINTENANCE' || status === 'OUT_OF_SERVICE') {
    return 'UNAVAILABLE';
  }
  return availabilityStatus;
}

export const TRUCK_JSONB_FIELDS = [
  'complianceDocuments',
  'cargoCapabilities',
  'loadingCapabilities',
  'securityFeatures',
  'certifications',
  'routeCapabilities',
  'costStructure',
  'emergencyContacts',
  'equipmentList',
  'insuranceAlerts',
  'assetDetails',
] as const;

export function toPublicTruck(truck: any): any {
  if (!truck) return truck;
  const location =
    truck.currentLocation && typeof truck.currentLocation === 'object'
      ? {
          ...(truck.currentLocation.coordinates
            ? { coordinates: truck.currentLocation.coordinates }
            : truck.currentLocation),
          address: truck.currentAddress || truck.currentLocation.address,
        }
      : truck.currentAddress
        ? { address: truck.currentAddress }
        : truck.currentLocation;

  return {
    ...truck,
    currentLocation: location,
    currentAddress: truck.currentAddress,
    assetDetails: truck.assetDetails || {},
    complianceDocuments: truck.complianceDocuments || {},
    cargoCapabilities: truck.cargoCapabilities || {},
    loadingCapabilities: truck.loadingCapabilities || {},
    securityFeatures: truck.securityFeatures || {},
    certifications: truck.certifications || {},
    routeCapabilities: truck.routeCapabilities || {},
    costStructure: truck.costStructure || {},
    emergencyContacts: Array.isArray(truck.emergencyContacts) ? truck.emergencyContacts : [],
    insuranceAlerts: Array.isArray(truck.insuranceAlerts) ? truck.insuranceAlerts : [],
    assignedDrivers: Array.isArray(truck.assignedDrivers) ? truck.assignedDrivers : [],
    assignedRoutes: Array.isArray(truck.assignedRoutes) ? truck.assignedRoutes : [],
    equipmentList: Array.isArray(truck.equipmentList) ? truck.equipmentList : [],
    maintenanceAlerts: Array.isArray(truck.maintenanceAlerts) ? truck.maintenanceAlerts : [],
    inspectionAlerts: Array.isArray(truck.inspectionAlerts) ? truck.inspectionAlerts : [],
    fuelAlerts: Array.isArray(truck.fuelAlerts) ? truck.fuelAlerts : [],
    tireAlerts: Array.isArray(truck.tireAlerts) ? truck.tireAlerts : [],
    complianceAlerts: Array.isArray(truck.complianceAlerts) ? truck.complianceAlerts : [],
  };
}
