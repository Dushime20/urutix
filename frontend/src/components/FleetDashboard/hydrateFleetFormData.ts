import { hydrateComplianceDocuments } from '../../utils/vehicleComplianceDocuments';
import { FleetStatus } from '../../types/fleet';

export const TRUCK_STATUSES = Object.values(FleetStatus);
export type TruckFormStatus = FleetStatus;

export function normalizeTruckStatus(status: any): FleetStatus {
  if (status && (TRUCK_STATUSES as string[]).includes(status)) {
    return status as FleetStatus;
  }
  return FleetStatus.AVAILABLE;
}

export function formatDateForInput(dateStr: any): string {
  if (!dateStr) return '';
  try {
    if (typeof dateStr === 'string') {
      const match = dateStr.match(/^(\d{4}-\d{2}-\d{2})/);
      if (match) return match[1];
    }
    const date = dateStr instanceof Date ? dateStr : new Date(dateStr);
    if (Number.isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return '';
  }
}

function toStr(value: any): string {
  if (value === undefined || value === null || value === '') return '';
  return String(value);
}

function flag(value: any): boolean {
  return value === true;
}

const ASSET_DATE_KEYS = [
  'purchaseDate',
  'leaseStartDate',
  'leaseEndDate',
  'fuelCardExpiry',
  'retirementDate',
];

const TRUCK_FLAG_KEYS = [
  'hasRefrigeration', 'hasLiftGate', 'hasGps', 'hasHazmatPermit',
  'hasSideRails', 'hasTarps', 'hasStraps', 'hasChains', 'hasWinch', 'hasRam',
  'hasTailLift', 'hasSideLift', 'hasRollerBed', 'hasDropDeck', 'hasExtendable',
  'hasLowbed', 'hasStepDeck', 'hasPowerOnly', 'hasContainerChassis',
  'hasTanker', 'hasBulk', 'hasRefrigerated', 'hasHeated', 'hasVentilated',
  'hasCurtainSide', 'hasBox', 'hasVan', 'hasPlatform', 'hasCarCarrier',
  'hasHeavyHaul', 'hasOversized', 'hasHazmat', 'hasDangerousGoods',
  'hasFoodGrade', 'hasPharmaceutical', 'hasLiquid', 'hasDryBulk', 'hasGas',
  'hasChemical', 'hasWaste', 'hasReefer', 'hasFrozen', 'hasChilled', 'hasAmbient',
  'hasControlledAtmosphere', 'hasHumidityControl', 'hasTemperatureMonitoring',
  'hasGPS', 'hasTracking', 'hasTelematics', 'hasELD', 'hasDashCam', 'hasSafetyCameras',
  'hasCollisionAvoidance', 'hasLaneDeparture', 'hasAdaptiveCruise', 'hasBlindSpot',
  'hasBackupCamera', 'hasTirePressureMonitoring', 'hasEngineMonitoring',
  'hasFuelMonitoring', 'hasMaintenanceAlerts', 'hasDriverMonitoring',
  'hasFatigueMonitoring', 'hasSpeedMonitoring', 'hasIdleMonitoring',
  'hasRouteOptimization', 'hasRealTimeTracking', 'hasGeofencing',
  'hasTemperatureAlerts', 'hasHumidityAlerts', 'hasShockMonitoring',
  'hasTiltMonitoring', 'hasDoorMonitoring', 'hasCargoMonitoring',
  'hasWeightMonitoring', 'hasVolumeMonitoring', 'hasPressureMonitoring',
  'hasFlowMonitoring', 'hasLevelMonitoring', 'hasQualityMonitoring',
  'hasContaminationMonitoring', 'hasLeakDetection', 'hasOverfillProtection',
  'hasEmergencyShutdown', 'hasFireSuppression', 'hasExplosionProof',
  'hasCorrosionResistant', 'hasStainlessSteel', 'hasAluminum', 'hasCarbonSteel',
  'hasFiberglass', 'hasPlastic', 'hasComposite', 'hasInsulated',
] as const;

function emptyFlags(): Record<string, boolean> {
  return Object.fromEntries(TRUCK_FLAG_KEYS.map((key) => [key, false]));
}

function hydrateAssetDetails(raw: any): Record<string, any> {
  const details: Record<string, any> = {
    retirementStatus: 'ACTIVE',
    ...(raw && typeof raw === 'object' ? raw : {}),
  };
  ASSET_DATE_KEYS.forEach((key) => {
    if (details[key]) details[key] = formatDateForInput(details[key]);
  });
  if (Array.isArray(details.insuranceClaims)) {
    details.insuranceClaims = details.insuranceClaims.map((claim: any) => ({
      ...claim,
      incidentDate: formatDateForInput(claim?.incidentDate),
    }));
  }
  if (Array.isArray(details.photos)) {
    details.photos = details.photos.map((photo: any) => ({
      ...photo,
      previewUrl:
        photo?.previewUrl ||
        photo?.url ||
        photo?.fileUrl ||
        photo?.downloadUrl ||
        photo?.thumbnailUrl ||
        '',
    }));
  }
  return details;
}

export function getEmptyTruckFormData(): Record<string, any> {
  return {
    plateNumber: '',
    vin: '',
    make: '',
    model: '',
    year: '',
    color: '',
    fuelType: '',
    capacityWeight: '',
    capacityVolume: '',
    registrationNumber: '',
    registrationExpiry: '',
    insurancePolicy: '',
    insuranceExpiry: '',
    roadworthyCertExpiry: '',
    mileage: '',
    truckType: '',
    trailerType: '',
    status: FleetStatus.AVAILABLE,
    manufacturer: '',
    chassis: '',
    availabilityStatus: 'AVAILABLE',
    ownershipType: '',
    vehicleClass: '',
    fleetGroup: '',
    businessUnit: '',
    costCenter: '',
    chassisConfiguration: '',
    dotNumber: '',
    mcNumber: '',
    operatingAuthority: '',
    crossBorderPermit: '',
    customsBond: '',
    portAuthorization: '',
    hasCrossBorderPermit: false,
    complianceDocuments: hydrateComplianceDocuments(),
    axleConfiguration: '',
    fuelTankCapacity: '',
    engineModel: '',
    horsepower: '',
    torque: '',
    transmission: '',
    grossVehicleWeight: '',
    driverRequirements: '',
    operationalRestrictions: '',
    emergencyContacts: [{ name: '', phone: '', relationship: '', email: '' }],
    assetDetails: { retirementStatus: 'ACTIVE' },
    createdBy: '',
    updatedBy: '',
    lastMaintenanceDate: '',
    nextMaintenanceDate: '',
    maxLength: '',
    maxWidth: '',
    maxHeight: '',
    fuelEfficiency: '',
    equipmentList: [],
    loadingCapabilities: {},
    securityFeatures: {},
    cargoCapabilities: {},
    certifications: {},
    routeCapabilities: {},
    costStructure: {},
    ...emptyFlags(),
  };
}

export function hydrateTruckFormData(initialData: any): Record<string, any> {
  const data = initialData || {};
  const empty = getEmptyTruckFormData();
  const loading = data.loadingCapabilities && typeof data.loadingCapabilities === 'object'
    ? data.loadingCapabilities
    : {};
  const cargo = data.cargoCapabilities && typeof data.cargoCapabilities === 'object'
    ? data.cargoCapabilities
    : {};
  const security = data.securityFeatures && typeof data.securityFeatures === 'object'
    ? data.securityFeatures
    : {};
  const certs = data.certifications && typeof data.certifications === 'object'
    ? data.certifications
    : {};
  const routes = data.routeCapabilities && typeof data.routeCapabilities === 'object'
    ? data.routeCapabilities
    : {};
  const costs = data.costStructure && typeof data.costStructure === 'object'
    ? data.costStructure
    : {};
  const flags = Object.fromEntries(
    TRUCK_FLAG_KEYS.map((key) => [
      key,
      flag(data[key] ?? cargo[key] ?? security[key] ?? loading[key] ?? certs[key]),
    ]),
  );

  const hasLiftGate = flag(data.hasLiftGate || loading.hasForklift);
  const hasWinch = flag(data.hasWinch || loading.hasCrane);
  const hasTailLift = flag(data.hasTailLift || loading.hasLoadingDock);

  return {
    ...empty,
    ...flags,
    plateNumber: data.plateNumber || data.licensePlate || '',
    vin: data.vin || data.vinNumber || '',
    make: data.make || '',
    model: data.model || '',
    year: toStr(data.year),
    color: data.color || '',
    fuelType: data.fuelType || '',
    capacityWeight: toStr(data.capacityWeight),
    capacityVolume: toStr(data.capacityVolume),
    registrationNumber: data.registrationNumber || data.complianceDocuments?.registration?.number || '',
    registrationExpiry: formatDateForInput(data.registrationExpiry || data.complianceDocuments?.registration?.expiryDate),
    insurancePolicy: data.insurancePolicy || data.complianceDocuments?.insurance?.number || '',
    insuranceExpiry: formatDateForInput(data.insuranceExpiry || data.complianceDocuments?.insurance?.expiryDate),
    roadworthyCertExpiry: formatDateForInput(data.roadworthyCertExpiry || data.complianceDocuments?.roadworthy?.expiryDate),
    mileage: toStr(data.mileage),
    truckType: data.truckType || '',
    trailerType: data.trailerType || '',
    status: normalizeTruckStatus(data.status),
    manufacturer: data.manufacturer || '',
    chassis: data.chassis || '',
    availabilityStatus: data.availabilityStatus || 'AVAILABLE',
    ownershipType: data.ownershipType || '',
    vehicleClass: data.vehicleClass || '',
    fleetGroup: data.fleetGroup || '',
    businessUnit: data.businessUnit || '',
    costCenter: data.costCenter || '',
    chassisConfiguration: data.chassisConfiguration || '',
    dotNumber: data.dotNumber || '',
    mcNumber: data.mcNumber || '',
    operatingAuthority: data.operatingAuthority || data.complianceDocuments?.operatingAuthority?.number || '',
    crossBorderPermit: data.crossBorderPermit || data.complianceDocuments?.crossBorderPermit?.number || '',
    customsBond: data.customsBond || data.complianceDocuments?.customsBond?.number || '',
    portAuthorization: data.portAuthorization || data.complianceDocuments?.portAuthorization?.number || '',
    hasCrossBorderPermit: Boolean(
      data.hasCrossBorderPermit ||
      data.crossBorderPermit ||
      data.customsBond ||
      data.portAuthorization ||
      data.complianceDocuments?.crossBorderPermit?.number ||
      data.complianceDocuments?.customsBond?.number ||
      data.complianceDocuments?.portAuthorization?.number ||
      routes.supportsBorderCrossing ||
      routes.supportsPortAccess,
    ),
    complianceDocuments: hydrateComplianceDocuments(data.complianceDocuments, {
      insurancePolicy: data.insurancePolicy,
      insuranceExpiry: formatDateForInput(data.insuranceExpiry),
      registrationNumber: data.registrationNumber,
      registrationExpiry: formatDateForInput(data.registrationExpiry),
      roadworthyCertExpiry: formatDateForInput(data.roadworthyCertExpiry),
      operatingAuthority: data.operatingAuthority,
      crossBorderPermit: data.crossBorderPermit,
      customsBond: data.customsBond,
      portAuthorization: data.portAuthorization,
      insuranceStatus:
        data.complianceDocuments?.insurance?.status ||
        (Array.isArray(data.insuranceAlerts)
          ? data.insuranceAlerts.find((item: any) => item?.source === 'vehicle_form' || item?.id === 'ins-vehicle-form')?.status
          : undefined),
      insuranceIssuingAuthority:
        data.complianceDocuments?.insurance?.issuingAuthority ||
        (Array.isArray(data.insuranceAlerts)
          ? data.insuranceAlerts.find((item: any) => item?.source === 'vehicle_form' || item?.id === 'ins-vehicle-form')?.issuingAuthority
          : undefined),
      insuranceIssueDate: formatDateForInput(
        data.complianceDocuments?.insurance?.issueDate ||
        (Array.isArray(data.insuranceAlerts)
          ? data.insuranceAlerts.find((item: any) => item?.source === 'vehicle_form' || item?.id === 'ins-vehicle-form')?.issueDate
          : undefined),
      ),
    }),
    axleConfiguration: data.axleConfiguration || '',
    fuelTankCapacity: toStr(data.fuelTankCapacity),
    engineModel: data.engineModel || '',
    horsepower: toStr(data.horsepower),
    torque: toStr(data.torque),
    transmission: data.transmission || '',
    grossVehicleWeight: toStr(data.grossVehicleWeight),
    driverRequirements: data.driverRequirements || '',
    operationalRestrictions: data.operationalRestrictions || '',
    emergencyContacts:
      Array.isArray(data.emergencyContacts) && data.emergencyContacts.length > 0
        ? data.emergencyContacts
        : empty.emergencyContacts,
    assetDetails: hydrateAssetDetails(data.assetDetails),
    createdBy: data.createdBy || data.assetDetails?.createdBy || '',
    updatedBy: data.updatedBy || data.assetDetails?.updatedBy || '',
    lastMaintenanceDate: formatDateForInput(data.lastMaintenanceDate),
    nextMaintenanceDate: formatDateForInput(data.nextMaintenanceDate),
    maxLength: toStr(data.maxLength),
    maxWidth: toStr(data.maxWidth),
    maxHeight: toStr(data.maxHeight),
    fuelEfficiency: toStr(data.fuelEfficiency),
    equipmentList: Array.isArray(data.equipmentList) ? data.equipmentList : [],
    hasLiftGate,
    hasWinch,
    hasTailLift,
    hasGps: flag(data.hasGps ?? data.hasGPS ?? security.hasGps),
    hasGPS: flag(data.hasGPS ?? data.hasGps ?? security.hasGps),
    loadingCapabilities: {
      ...loading,
      hasForklift: flag(loading.hasForklift || hasLiftGate),
      hasCrane: flag(loading.hasCrane || hasWinch),
      hasLoadingDock: flag(loading.hasLoadingDock || hasTailLift),
      maxLoadingTime: loading.maxLoadingTime ?? '',
      maxUnloadingTime: loading.maxUnloadingTime ?? '',
    },
    cargoCapabilities: {
      ...cargo,
      supportedCargoTypes: Array.isArray(cargo.supportedCargoTypes) ? cargo.supportedCargoTypes : [],
      temperatureRange: cargo.temperatureRange || {},
      humidityControl: cargo.humidityControl ?? cargo.hasHumidityControl ?? data.hasHumidityControl ?? false,
      hasTanker: flag(data.hasTanker ?? cargo.hasTanker),
      hasBulk: flag(data.hasBulk ?? cargo.hasBulk),
      hasRefrigerated: flag(data.hasRefrigerated ?? cargo.hasRefrigerated),
      hasHeated: flag(data.hasHeated ?? cargo.hasHeated),
      hasVentilated: flag(data.hasVentilated ?? cargo.hasVentilated),
      hasCurtainSide: flag(data.hasCurtainSide ?? cargo.hasCurtainSide),
      hasBox: flag(data.hasBox ?? cargo.hasBox),
      hasVan: flag(data.hasVan ?? cargo.hasVan),
      hasPlatform: flag(data.hasPlatform ?? cargo.hasPlatform),
      hasCarCarrier: flag(data.hasCarCarrier ?? cargo.hasCarCarrier),
      hasHeavyHaul: flag(data.hasHeavyHaul ?? cargo.hasHeavyHaul),
      hasOversized: flag(data.hasOversized ?? cargo.hasOversized),
      hasHazmat: flag(data.hasHazmat ?? cargo.hasHazmat),
      hasDangerousGoods: flag(data.hasDangerousGoods ?? cargo.hasDangerousGoods),
      hasFoodGrade: flag(data.hasFoodGrade ?? cargo.hasFoodGrade),
      hasPharmaceutical: flag(data.hasPharmaceutical ?? cargo.hasPharmaceutical),
      hasLiquid: flag(data.hasLiquid ?? cargo.hasLiquid),
      hasDryBulk: flag(data.hasDryBulk ?? cargo.hasDryBulk),
      hasGas: flag(data.hasGas ?? cargo.hasGas),
      hasChemical: flag(data.hasChemical ?? cargo.hasChemical),
      hasWaste: flag(data.hasWaste ?? cargo.hasWaste),
      hasReefer: flag(data.hasReefer ?? cargo.hasReefer),
      hasFrozen: flag(data.hasFrozen ?? cargo.hasFrozen),
      hasChilled: flag(data.hasChilled ?? cargo.hasChilled),
      hasAmbient: flag(data.hasAmbient ?? cargo.hasAmbient),
      hasControlledAtmosphere: flag(data.hasControlledAtmosphere ?? cargo.hasControlledAtmosphere),
      hasHumidityControl: flag(data.hasHumidityControl ?? cargo.hasHumidityControl ?? cargo.humidityControl),
      hasTemperatureMonitoring: flag(data.hasTemperatureMonitoring ?? cargo.hasTemperatureMonitoring),
    },
    certifications: {
      ...certs,
      hazmatCertified: flag(data.hasHazmatPermit ?? data.hasHazmat ?? certs.hazmatCertified),
      dangerousGoodsCertified: flag(data.hasDangerousGoods ?? certs.dangerousGoodsCertified),
      foodGradeCertified: flag(data.hasFoodGrade ?? certs.foodGradeCertified),
      pharmaceuticalCertified: flag(data.hasPharmaceutical ?? certs.pharmaceuticalCertified),
    },
    routeCapabilities: { ...routes },
    costStructure: {
      ...costs,
      hazmatSurcharge: costs.hazmatSurcharge ?? costs.hazardousSurcharge,
    },
    securityFeatures: {
      ...security,
      hasGps: flag(data.hasGps ?? data.hasGPS ?? security.hasGps),
      hasTracking: flag(data.hasTracking ?? security.hasTracking),
      hasTelematics: flag(data.hasTelematics ?? security.hasTelematics),
      hasRouteOptimization: flag(data.hasRouteOptimization ?? security.hasRouteOptimization),
      hasRealTimeTracking: flag(data.hasRealTimeTracking ?? security.hasRealTimeTracking),
      hasGeofencing: flag(data.hasGeofencing ?? security.hasGeofencing),
      hasDashCam: flag(data.hasDashCam ?? security.hasDashCam),
      hasSafetyCameras: flag(data.hasSafetyCameras ?? security.hasSafetyCameras),
      hasCollisionAvoidance: flag(data.hasCollisionAvoidance ?? security.hasCollisionAvoidance),
      hasLaneDeparture: flag(data.hasLaneDeparture ?? security.hasLaneDeparture),
      hasAdaptiveCruise: flag(data.hasAdaptiveCruise ?? security.hasAdaptiveCruise),
      hasBlindSpot: flag(data.hasBlindSpot ?? security.hasBlindSpot),
      hasBackupCamera: flag(data.hasBackupCamera ?? security.hasBackupCamera),
      hasCargoMonitoring: flag(data.hasCargoMonitoring ?? security.hasCargoMonitoring),
      hasWeightMonitoring: flag(data.hasWeightMonitoring ?? security.hasWeightMonitoring),
      hasVolumeMonitoring: flag(data.hasVolumeMonitoring ?? security.hasVolumeMonitoring),
      hasDoorMonitoring: flag(data.hasDoorMonitoring ?? security.hasDoorMonitoring),
      hasShockMonitoring: flag(data.hasShockMonitoring ?? security.hasShockMonitoring),
      hasTiltMonitoring: flag(data.hasTiltMonitoring ?? security.hasTiltMonitoring),
      hasTemperatureAlerts: flag(data.hasTemperatureAlerts ?? security.hasTemperatureAlerts),
      hasHumidityAlerts: flag(data.hasHumidityAlerts ?? security.hasHumidityAlerts),
      hasPressureMonitoring: flag(data.hasPressureMonitoring ?? security.hasPressureMonitoring),
      hasFlowMonitoring: flag(data.hasFlowMonitoring ?? security.hasFlowMonitoring),
      hasLevelMonitoring: flag(data.hasLevelMonitoring ?? security.hasLevelMonitoring),
      hasQualityMonitoring: flag(data.hasQualityMonitoring ?? security.hasQualityMonitoring),
      hasContaminationMonitoring: flag(data.hasContaminationMonitoring ?? security.hasContaminationMonitoring),
      hasELD: flag(data.hasELD ?? security.hasELD),
      hasDriverMonitoring: flag(data.hasDriverMonitoring ?? security.hasDriverMonitoring),
      hasFatigueMonitoring: flag(data.hasFatigueMonitoring ?? security.hasFatigueMonitoring),
      hasSpeedMonitoring: flag(data.hasSpeedMonitoring ?? security.hasSpeedMonitoring),
      hasIdleMonitoring: flag(data.hasIdleMonitoring ?? security.hasIdleMonitoring),
      hasTirePressureMonitoring: flag(data.hasTirePressureMonitoring ?? security.hasTirePressureMonitoring),
      hasEngineMonitoring: flag(data.hasEngineMonitoring ?? security.hasEngineMonitoring),
      hasFuelMonitoring: flag(data.hasFuelMonitoring ?? security.hasFuelMonitoring),
      hasMaintenanceAlerts: flag(data.hasMaintenanceAlerts ?? security.hasMaintenanceAlerts),
      hasLeakDetection: flag(data.hasLeakDetection ?? security.hasLeakDetection),
      hasFireSuppression: flag(data.hasFireSuppression ?? security.hasFireSuppression),
      hasEmergencyShutdown: flag(data.hasEmergencyShutdown ?? security.hasEmergencyShutdown),
      hasExplosionProof: flag(data.hasExplosionProof ?? security.hasExplosionProof),
      hasOverfillProtection: flag(data.hasOverfillProtection ?? security.hasOverfillProtection),
    },
  };
}

export function getEmptyDriverFormData(): Record<string, any> {
  return {
    firstName: '',
    lastName: '',
    licenseNumber: '',
    licenseType: '',
    licenseState: '',
    licenseCountry: '',
    licenseIssueDate: '',
    licenseExpiry: '',
    dateOfBirth: '',
    address: '',
    employmentType: '',
    hireDate: '',
    status: 'ACTIVE',
    availabilityStatus: 'AVAILABLE',
    experience: '',
    driverNotes: '',
    specialCertifications: '',
    hourlyRate: '',
    mileageRate: '',
    medicalCertExpiry: '',
    drugTestDate: '',
    backgroundCheckDate: '',
    trainingCompletionDate: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: '',
    },
    contactInfo: {
      phone: '',
      email: '',
    },
  };
}

export function hydrateDriverFormData(initialData: any): Record<string, any> {
  const data = initialData || {};
  const empty = getEmptyDriverFormData();
  return {
    ...empty,
    firstName: data.firstName || '',
    lastName: data.lastName || '',
    dateOfBirth: formatDateForInput(data.dateOfBirth),
    licenseNumber: data.licenseNumber || '',
    licenseType: data.licenseType || (Array.isArray(data.licenseClasses) ? data.licenseClasses[0] : '') || '',
    licenseIssueDate: formatDateForInput(data.licenseIssueDate),
    licenseExpiry: formatDateForInput(data.licenseExpiry),
    licenseState: data.licenseState || '',
    licenseCountry: data.licenseCountry || '',
    address: data.address || '',
    employmentType: data.employmentType || '',
    hireDate: formatDateForInput(data.hireDate),
    status: data.status || 'ACTIVE',
    availabilityStatus: data.availabilityStatus || 'AVAILABLE',
    experience: toStr(data.experience),
    driverNotes: data.driverNotes || '',
    specialCertifications: data.specialCertifications || '',
    hourlyRate: toStr(data.hourlyRate),
    mileageRate: toStr(data.mileageRate),
    medicalCertExpiry: formatDateForInput(data.medicalCertExpiry),
    drugTestDate: formatDateForInput(data.drugTestDate),
    backgroundCheckDate: formatDateForInput(data.backgroundCheckDate),
    trainingCompletionDate: formatDateForInput(data.trainingCompletionDate),
    emergencyContact: {
      name: data.emergencyContact?.name || '',
      phone: data.emergencyContact?.phone || '',
      relationship: data.emergencyContact?.relationship || '',
    },
    contactInfo: {
      phone: data.contactInfo?.phone || data.phone || '',
      email: data.contactInfo?.email || data.email || '',
    },
  };
}
