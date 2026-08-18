export type VehiclePhotoRecord = {
  documentId?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  previewUrl?: string;
  file?: File;
};

export function cargoTypesOf(formData: any): string[] {
  return formData?.cargoCapabilities?.supportedCargoTypes || [];
}

export function hasCargoType(formData: any, type: string): boolean {
  return cargoTypesOf(formData).includes(type);
}

function num(value: any): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = typeof value === 'string' ? parseFloat(value) : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function filled(value: any): boolean {
  if (typeof value === 'boolean') return value;
  return value !== undefined && value !== null && String(value).trim() !== '';
}

export function getExpiryAlerts(formData: any): string[] {
  const alerts: string[] = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const soon = new Date(now);
  soon.setDate(soon.getDate() + 30);

  const check = (label: string, value?: string) => {
    if (!value) return;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return;
    date.setHours(0, 0, 0, 0);
    if (date < now) alerts.push(`${label} has expired`);
    else if (date <= soon) alerts.push(`${label} expires within 30 days`);
  };

  check('Insurance', formData?.insuranceExpiry || formData?.complianceDocuments?.insurance?.expiryDate);
  check('Registration', formData?.registrationExpiry);
  check('Roadworthy certificate', formData?.roadworthyCertExpiry || formData?.complianceDocuments?.roadworthy?.expiryDate);
  return alerts;
}

export function getEnterpriseValidationErrors(formData: any, stepId?: number): string[] {
  const errors: string[] = [];
  const details = formData?.assetDetails || {};
  const security = formData?.securityFeatures || {};
  const include = (id: number) => stepId === undefined || stepId === id;

  if (include(3)) {
    if (formData?.fuelType === 'ELECTRIC') {
      if (!filled(details.batteryCapacity)) errors.push('Electric vehicles require battery capacity');
      if (!filled(details.chargingType)) errors.push('Electric vehicles require charging type');
      if (!filled(details.chargingSpeed)) errors.push('Electric vehicles require charging speed');
      if (!filled(details.operatingRange)) errors.push('Electric vehicles require operating range');
    }
    if (formData?.fuelType === 'HYBRID') {
      if (!filled(details.batteryCapacity)) errors.push('Hybrid vehicles require battery capacity');
      if (!filled(formData?.fuelTankCapacity)) errors.push('Hybrid vehicles require fuel tank capacity');
    }
  }

  const refrigerated =
    hasCargoType(formData, 'REFRIGERATED') ||
    Boolean(formData?.cargoCapabilities?.maxRefrigeratedHandling) ||
    Boolean(formData?.hasReefer) ||
    Boolean(formData?.cargoCapabilities?.hasReefer);
  const hazardous =
    hasCargoType(formData, 'HAZARDOUS') || Boolean(formData?.cargoCapabilities?.maxHazardousHandling);
  const liquid =
    hasCargoType(formData, 'LIQUID') || Boolean(formData?.cargoCapabilities?.maxLiquidHandling);
  const valuable =
    hasCargoType(formData, 'VALUABLE') || Boolean(formData?.cargoCapabilities?.maxValuableHandling);
  const oversized =
    hasCargoType(formData, 'OVERSIZED') || Boolean(formData?.cargoCapabilities?.maxOversizedHandling);

  if (include(4) && refrigerated) {
    const min = formData?.cargoCapabilities?.temperatureRange?.min;
    const max = formData?.cargoCapabilities?.temperatureRange?.max;
    if (!filled(min) || !filled(max)) {
      errors.push('Refrigerated cargo requires temperature limits');
    }
  }

  if (include(6) && refrigerated && !security.hasTemperatureAlerts) {
    errors.push('Refrigerated cargo requires temperature alert monitoring');
  }

  if (include(7) && hazardous && !formData?.certifications?.hazmatCertified) {
    errors.push('Hazardous cargo requires Hazmat certification');
  }
  if (include(6) && hazardous && !(security.hasLeakDetection || security.hasFireSuppression || security.hasEmergencyShutdown)) {
    errors.push('Hazardous cargo requires safety controls (leak detection, fire suppression, or emergency shutdown)');
  }

  if (include(4) && liquid) {
    const tankerReady =
      Boolean(formData?.hasTanker) ||
      formData?.trailerType === 'TANKER' ||
      formData?.truckType === 'TANKER' ||
      Boolean(formData?.cargoCapabilities?.hasTanker);
    if (!tankerReady) {
      errors.push('Liquid cargo requires a tanker-compatible configuration');
    }
  }

  if (include(6) && valuable) {
    if (!security.hasGps || !security.hasRealTimeTracking || !security.hasGeofencing) {
      errors.push('Valuable cargo requires GPS, real-time tracking, and geofencing');
    }
  }
  if (include(2) && valuable && !formData?.insurancePolicy && !formData?.complianceDocuments?.insurance?.number) {
    errors.push('Valuable cargo requires insurance coverage');
  }

  if (include(4) && oversized) {
    if (!filled(formData?.maxLength) || !filled(formData?.maxWidth) || !filled(formData?.maxHeight)) {
      errors.push('Oversized cargo requires vehicle dimensions');
    }
    if (!filled(formData?.cargoCapabilities?.maxWeight) && !filled(formData?.capacityWeight)) {
      errors.push('Oversized cargo requires declared weight limits');
    }
  }

  if (include(4)) {
    const payload = num(formData?.capacityWeight);
    const cargoWeight = num(formData?.cargoCapabilities?.maxWeight);
    if (payload !== undefined && cargoWeight !== undefined && cargoWeight > payload) {
      errors.push('Cargo weight must not exceed payload capacity');
    }
    const axle = num(formData?.cargoCapabilities?.maxWeightPerAxle);
    const gvw = num(formData?.grossVehicleWeight);
    if (axle !== undefined && gvw !== undefined && axle > gvw) {
      errors.push('Axle weight limits must not exceed gross vehicle weight');
    }
  }

  if ((include(2) || include(7)) && formData?.routeCapabilities?.supportsBorderCrossing) {
    const permit =
      formData?.crossBorderPermit ||
      formData?.complianceDocuments?.crossBorderPermit?.number;
    if (!permit) errors.push('Border-crossing routes require an international permit');
    if (!formData?.insurancePolicy && !formData?.complianceDocuments?.insurance?.number) {
      errors.push('Border-crossing routes require insurance coverage');
    }
  }

  if ((include(2) || include(7)) && formData?.routeCapabilities?.supportsPortAccess) {
    const port =
      formData?.portAuthorization ||
      formData?.complianceDocuments?.portAuthorization?.number;
    if (!port) errors.push('Port access routes require port credentials');
  }

  if (include(7) && formData?.routeCapabilities?.supportsAirFreight && !filled(details.airCargoCompliance)) {
    errors.push('Air freight compatibility requires air cargo compliance details');
  }

  return errors;
}

export function stripPhotoFiles(photos?: VehiclePhotoRecord[] | null): VehiclePhotoRecord[] {
  return (photos || []).map(({ file: _file, previewUrl: _preview, ...rest }) => rest);
}

export function hasPendingPhotoFiles(photos?: VehiclePhotoRecord[] | null): boolean {
  return (photos || []).some((photo) => photo?.file instanceof File);
}

export async function uploadVehiclePhotos(
  truckId: string,
  photos?: VehiclePhotoRecord[] | null,
): Promise<VehiclePhotoRecord[]> {
  const { documentApi } = await import('../services/documents/documentApi');
  const next: VehiclePhotoRecord[] = [];
  for (const photo of photos || []) {
    if (!(photo.file instanceof File)) {
      const { file: _f, previewUrl: _p, ...rest } = photo;
      if (rest.documentId || rest.fileName) next.push(rest);
      continue;
    }
    const uploaded = await documentApi.createDocument(
      {
        entityType: 'TRUCK',
        entityId: truckId,
        documentType: 'OTHER',
        category: 'OPERATIONAL',
        title: photo.fileName || photo.file.name,
        description: 'Vehicle photo',
        tags: ['VEHICLE_PHOTO'],
        metadata: { kind: 'VEHICLE_PHOTO' },
      },
      photo.file,
    );
    if (photo.previewUrl) URL.revokeObjectURL(photo.previewUrl);
    next.push({
      documentId: uploaded.id,
      fileName: uploaded.originalFileName || photo.file.name,
      fileSize: uploaded.fileSize || photo.file.size,
      mimeType: uploaded.mimeType || photo.file.type,
    });
  }
  return next;
}
