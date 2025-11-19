import {
  IsString,
  IsNumber,
  IsEnum,
  IsBoolean,
  IsOptional,
  Min,
  Max,
  MaxLength,
  IsDateString,
  IsArray,
} from 'class-validator';
import {
  FuelType,
  VehicleStatus,
  TruckType,
  TrailerType,
} from '../../../entities/truck.entity';

export class CreateTruckDto {
  @IsString()
  @MaxLength(20)
  plateNumber: string;

  @IsString()
  @MaxLength(17)
  vin: string;

  @IsString()
  @MaxLength(100)
  make: string;

  @IsString()
  @MaxLength(100)
  model: string;

  @IsNumber()
  @Min(1900)
  @Max(2030)
  year: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  color?: string;

  @IsEnum(FuelType)
  fuelType: FuelType;

  @IsNumber()
  @Min(1)
  capacityWeight: number;

  @IsNumber()
  @Min(1)
  capacityVolume: number;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  maxLength?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  maxWidth?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  maxHeight?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  registrationNumber?: string;

  @IsOptional()
  @IsDateString()
  registrationExpiry?: Date;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  insurancePolicy?: string;

  @IsOptional()
  @IsDateString()
  insuranceExpiry?: Date;

  @IsOptional()
  @IsDateString()
  roadworthyCertExpiry?: Date;

  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;

  @IsOptional()
  @IsBoolean()
  hasRefrigeration?: boolean;

  @IsOptional()
  @IsBoolean()
  hasLiftGate?: boolean;

  @IsOptional()
  @IsBoolean()
  hasGps?: boolean;

  @IsOptional()
  @IsBoolean()
  hasHazmatPermit?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  equipmentList?: string[];

  @IsOptional()
  @IsDateString()
  lastMaintenanceDate?: Date;

  @IsOptional()
  @IsDateString()
  nextMaintenanceDate?: Date;

  @IsOptional()
  @IsNumber()
  @Min(0)
  mileage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fuelEfficiency?: number;

  // Cargo-specific specifications
  @IsOptional()
  @IsEnum(TruckType)
  truckType?: TruckType;

  @IsOptional()
  @IsEnum(TrailerType)
  trailerType?: TrailerType;

  // Essential cargo equipment
  @IsOptional()
  @IsBoolean()
  hasSideRails?: boolean;

  @IsOptional()
  @IsBoolean()
  hasTarps?: boolean;

  @IsOptional()
  @IsBoolean()
  hasStraps?: boolean;

  @IsOptional()
  @IsBoolean()
  hasChains?: boolean;

  @IsOptional()
  @IsBoolean()
  hasWinch?: boolean;

  @IsOptional()
  @IsBoolean()
  hasRam?: boolean;

  @IsOptional()
  @IsBoolean()
  hasTailLift?: boolean;

  @IsOptional()
  @IsBoolean()
  hasSideLift?: boolean;

  @IsOptional()
  @IsBoolean()
  hasRollerBed?: boolean;

  @IsOptional()
  @IsBoolean()
  hasDropDeck?: boolean;

  @IsOptional()
  @IsBoolean()
  hasExtendable?: boolean;

  @IsOptional()
  @IsBoolean()
  hasLowbed?: boolean;

  @IsOptional()
  @IsBoolean()
  hasStepDeck?: boolean;

  @IsOptional()
  @IsBoolean()
  hasPowerOnly?: boolean;

  @IsOptional()
  @IsBoolean()
  hasContainerChassis?: boolean;

  // Cargo type capabilities
  @IsOptional()
  @IsBoolean()
  hasTanker?: boolean;

  @IsOptional()
  @IsBoolean()
  hasBulk?: boolean;

  @IsOptional()
  @IsBoolean()
  hasRefrigerated?: boolean;

  @IsOptional()
  @IsBoolean()
  hasHeated?: boolean;

  @IsOptional()
  @IsBoolean()
  hasVentilated?: boolean;

  @IsOptional()
  @IsBoolean()
  hasCurtainSide?: boolean;

  @IsOptional()
  @IsBoolean()
  hasBox?: boolean;

  @IsOptional()
  @IsBoolean()
  hasVan?: boolean;

  @IsOptional()
  @IsBoolean()
  hasPlatform?: boolean;

  @IsOptional()
  @IsBoolean()
  hasCarCarrier?: boolean;

  @IsOptional()
  @IsBoolean()
  hasHeavyHaul?: boolean;

  @IsOptional()
  @IsBoolean()
  hasOversized?: boolean;

  // Specialized cargo capabilities
  @IsOptional()
  @IsBoolean()
  hasHazmat?: boolean;

  @IsOptional()
  @IsBoolean()
  hasDangerousGoods?: boolean;

  @IsOptional()
  @IsBoolean()
  hasFoodGrade?: boolean;

  @IsOptional()
  @IsBoolean()
  hasPharmaceutical?: boolean;

  @IsOptional()
  @IsBoolean()
  hasLiquid?: boolean;

  @IsOptional()
  @IsBoolean()
  hasDryBulk?: boolean;

  @IsOptional()
  @IsBoolean()
  hasGas?: boolean;

  @IsOptional()
  @IsBoolean()
  hasChemical?: boolean;

  @IsOptional()
  @IsBoolean()
  hasWaste?: boolean;

  // Temperature control
  @IsOptional()
  @IsBoolean()
  hasReefer?: boolean;

  @IsOptional()
  @IsBoolean()
  hasFrozen?: boolean;

  @IsOptional()
  @IsBoolean()
  hasChilled?: boolean;

  @IsOptional()
  @IsBoolean()
  hasAmbient?: boolean;

  @IsOptional()
  @IsBoolean()
  hasControlledAtmosphere?: boolean;

  @IsOptional()
  @IsBoolean()
  hasHumidityControl?: boolean;

  @IsOptional()
  @IsBoolean()
  hasTemperatureMonitoring?: boolean;

  // Technology and tracking
  @IsOptional()
  @IsBoolean()
  hasGPS?: boolean;

  @IsOptional()
  @IsBoolean()
  hasTracking?: boolean;

  @IsOptional()
  @IsBoolean()
  hasTelematics?: boolean;

  @IsOptional()
  @IsBoolean()
  hasELD?: boolean;

  @IsOptional()
  @IsBoolean()
  hasDashCam?: boolean;

  @IsOptional()
  @IsBoolean()
  hasSafetyCameras?: boolean;

  // Safety features
  @IsOptional()
  @IsBoolean()
  hasCollisionAvoidance?: boolean;

  @IsOptional()
  @IsBoolean()
  hasLaneDeparture?: boolean;

  @IsOptional()
  @IsBoolean()
  hasAdaptiveCruise?: boolean;

  @IsOptional()
  @IsBoolean()
  hasBlindSpot?: boolean;

  @IsOptional()
  @IsBoolean()
  hasBackupCamera?: boolean;

  // Monitoring systems
  @IsOptional()
  @IsBoolean()
  hasTirePressureMonitoring?: boolean;

  @IsOptional()
  @IsBoolean()
  hasEngineMonitoring?: boolean;

  @IsOptional()
  @IsBoolean()
  hasFuelMonitoring?: boolean;

  @IsOptional()
  @IsBoolean()
  hasMaintenanceAlerts?: boolean;

  @IsOptional()
  @IsBoolean()
  hasDriverMonitoring?: boolean;

  @IsOptional()
  @IsBoolean()
  hasFatigueMonitoring?: boolean;

  @IsOptional()
  @IsBoolean()
  hasSpeedMonitoring?: boolean;

  @IsOptional()
  @IsBoolean()
  hasIdleMonitoring?: boolean;

  // Route and tracking
  @IsOptional()
  @IsBoolean()
  hasRouteOptimization?: boolean;

  @IsOptional()
  @IsBoolean()
  hasRealTimeTracking?: boolean;

  @IsOptional()
  @IsBoolean()
  hasGeofencing?: boolean;

  // Cargo monitoring
  @IsOptional()
  @IsBoolean()
  hasTemperatureAlerts?: boolean;

  @IsOptional()
  @IsBoolean()
  hasHumidityAlerts?: boolean;

  @IsOptional()
  @IsBoolean()
  hasShockMonitoring?: boolean;

  @IsOptional()
  @IsBoolean()
  hasTiltMonitoring?: boolean;

  @IsOptional()
  @IsBoolean()
  hasDoorMonitoring?: boolean;

  @IsOptional()
  @IsBoolean()
  hasCargoMonitoring?: boolean;

  @IsOptional()
  @IsBoolean()
  hasWeightMonitoring?: boolean;

  @IsOptional()
  @IsBoolean()
  hasVolumeMonitoring?: boolean;

  // Specialized monitoring
  @IsOptional()
  @IsBoolean()
  hasPressureMonitoring?: boolean;

  @IsOptional()
  @IsBoolean()
  hasFlowMonitoring?: boolean;

  @IsOptional()
  @IsBoolean()
  hasLevelMonitoring?: boolean;

  @IsOptional()
  @IsBoolean()
  hasQualityMonitoring?: boolean;

  @IsOptional()
  @IsBoolean()
  hasContaminationMonitoring?: boolean;

  // Safety systems
  @IsOptional()
  @IsBoolean()
  hasLeakDetection?: boolean;

  @IsOptional()
  @IsBoolean()
  hasOverfillProtection?: boolean;

  @IsOptional()
  @IsBoolean()
  hasEmergencyShutdown?: boolean;

  @IsOptional()
  @IsBoolean()
  hasFireSuppression?: boolean;

  @IsOptional()
  @IsBoolean()
  hasExplosionProof?: boolean;

  // Material specifications
  @IsOptional()
  @IsBoolean()
  hasCorrosionResistant?: boolean;

  @IsOptional()
  @IsBoolean()
  hasStainlessSteel?: boolean;

  @IsOptional()
  @IsBoolean()
  hasAluminum?: boolean;

  @IsOptional()
  @IsBoolean()
  hasCarbonSteel?: boolean;

  @IsOptional()
  @IsBoolean()
  hasFiberglass?: boolean;

  @IsOptional()
  @IsBoolean()
  hasPlastic?: boolean;

  @IsOptional()
  @IsBoolean()
  hasComposite?: boolean;

  @IsOptional()
  @IsBoolean()
  hasInsulated?: boolean;

  // Cargo-specific alignment fields
  @IsOptional()
  cargoCapabilities?: {
    supportedCargoTypes?: string[];
    maxFragileHandling?: boolean;
    maxHazardousHandling?: boolean;
    maxRefrigeratedHandling?: boolean;
    maxLiquidHandling?: boolean;
    maxOversizedHandling?: boolean;
    maxValuableHandling?: boolean;
    temperatureRange?: {
      min?: number;
      max?: number;
    };
    humidityControl?: boolean;
    maxStackableHeight?: number;
    maxClearanceHeight?: number;
    maxWeightPerAxle?: number;
    maxVolumeCapacity?: number;
    maxLengthCapacity?: number;
    maxWidthCapacity?: number;
    maxHeightCapacity?: number;
  };

  @IsOptional()
  loadingCapabilities?: {
    hasForklift?: boolean;
    hasCrane?: boolean;
    hasLoadingDock?: boolean;
    hasSideLift?: boolean;
    hasTailLift?: boolean;
    hasRollerBed?: boolean;
    hasDropDeck?: boolean;
    hasExtendable?: boolean;
    hasLowbed?: boolean;
    hasStepDeck?: boolean;
    hasPowerOnly?: boolean;
    hasContainerChassis?: boolean;
    maxLoadingTime?: number;
    maxUnloadingTime?: number;
  };

  @IsOptional()
  securityFeatures?: {
    hasGps?: boolean;
    hasTracking?: boolean;
    hasTelematics?: boolean;
    hasELD?: boolean;
    hasDashCam?: boolean;
    hasSafetyCameras?: boolean;
    hasCollisionAvoidance?: boolean;
    hasLaneDeparture?: boolean;
    hasAdaptiveCruise?: boolean;
    hasBlindSpot?: boolean;
    hasBackupCamera?: boolean;
    hasTirePressureMonitoring?: boolean;
    hasEngineMonitoring?: boolean;
    hasFuelMonitoring?: boolean;
    hasMaintenanceAlerts?: boolean;
    hasDriverMonitoring?: boolean;
    hasFatigueMonitoring?: boolean;
    hasSpeedMonitoring?: boolean;
    hasIdleMonitoring?: boolean;
    hasRouteOptimization?: boolean;
    hasRealTimeTracking?: boolean;
    hasGeofencing?: boolean;
    hasTemperatureAlerts?: boolean;
    hasHumidityAlerts?: boolean;
    hasShockMonitoring?: boolean;
    hasTiltMonitoring?: boolean;
    hasDoorMonitoring?: boolean;
    hasCargoMonitoring?: boolean;
    hasWeightMonitoring?: boolean;
    hasVolumeMonitoring?: boolean;
    hasPressureMonitoring?: boolean;
    hasFlowMonitoring?: boolean;
    hasLevelMonitoring?: boolean;
    hasQualityMonitoring?: boolean;
    hasContaminationMonitoring?: boolean;
    hasLeakDetection?: boolean;
    hasOverfillProtection?: boolean;
    hasEmergencyShutdown?: boolean;
    hasFireSuppression?: boolean;
    hasExplosionProof?: boolean;
    hasCorrosionResistant?: boolean;
    hasStainlessSteel?: boolean;
    hasAluminum?: boolean;
    hasCarbonSteel?: boolean;
    hasFiberglass?: boolean;
    hasPlastic?: boolean;
    hasComposite?: boolean;
    hasInsulated?: boolean;
  };

  @IsOptional()
  certifications?: {
    hazmatCertified?: boolean;
    dangerousGoodsCertified?: boolean;
    foodGradeCertified?: boolean;
    pharmaceuticalCertified?: boolean;
    liquidCertified?: boolean;
    dryBulkCertified?: boolean;
    gasCertified?: boolean;
    chemicalCertified?: boolean;
    wasteCertified?: boolean;
    reeferCertified?: boolean;
    frozenCertified?: boolean;
    chilledCertified?: boolean;
    ambientCertified?: boolean;
    controlledAtmosphereCertified?: boolean;
    humidityControlCertified?: boolean;
    temperatureMonitoringCertified?: boolean;
    maxInsuranceCoverage?: number;
    maxDriverExperience?: number;
    requiredCertifications?: string[];
  };

  @IsOptional()
  routeCapabilities?: {
    maxDistance?: number;
    maxHoursToAvailability?: number;
    supportsUrbanRoutes?: boolean;
    supportsRuralRoutes?: boolean;
    supportsHighwayRoutes?: boolean;
    supportsTollRoads?: boolean;
    supportsMountainRoutes?: boolean;
    supportsDesertRoutes?: boolean;
    supportsCoastalRoutes?: boolean;
    supportsInternationalRoutes?: boolean;
    maxTerrainDifficulty?: number;
    maxWeatherConditions?: string[];
    maxTrafficConditions?: string[];
    maxRoadConditions?: string[];
    maxSpeedLimit?: number;
    maxWeightLimit?: number;
    maxHeightLimit?: number;
    maxWidthLimit?: number;
    maxLengthLimit?: number;
    maxAxleWeight?: number;
    maxBridgeWeight?: number;
    maxTunnelHeight?: number;
    maxTunnelWidth?: number;
    maxTunnelLength?: number;
    maxBridgeHeight?: number;
    maxBridgeWidth?: number;
    maxBridgeLength?: number;
    maxFerryWeight?: number;
    maxFerryHeight?: number;
    maxFerryWidth?: number;
    maxFerryLength?: number;
  };

  @IsOptional()
  costStructure?: {
    baseRate?: number;
    perKmRate?: number;
    perHourRate?: number;
    fuelSurcharge?: number;
    tollSurcharge?: number;
    hazardousSurcharge?: number;
    refrigeratedSurcharge?: number;
    oversizedSurcharge?: number;
    valuableSurcharge?: number;
    fragileSurcharge?: number;
    liquidSurcharge?: number;
    insuranceSurcharge?: number;
    trackingSurcharge?: number;
    monitoringSurcharge?: number;
    securitySurcharge?: number;
    emergencySurcharge?: number;
    weekendSurcharge?: number;
    holidaySurcharge?: number;
    nightSurcharge?: number;
    rushSurcharge?: number;
    specialHandlingSurcharge?: number;
    loadingSurcharge?: number;
    unloadingSurcharge?: number;
    waitingSurcharge?: number;
    detentionSurcharge?: number;
    demurrageSurcharge?: number;
    layoverSurcharge?: number;
    deadheadSurcharge?: number;
    repositioningSurcharge?: number;
    cancellationSurcharge?: number;
    noShowSurcharge?: number;
    lateDeliverySurcharge?: number;
    earlyDeliverySurcharge?: number;
    damageSurcharge?: number;
    lossSurcharge?: number;
    theftSurcharge?: number;
    contaminationSurcharge?: number;
    temperatureDeviationSurcharge?: number;
    humidityDeviationSurcharge?: number;
    shockSurcharge?: number;
    tiltSurcharge?: number;
    vibrationSurcharge?: number;
    pressureSurcharge?: number;
    flowSurcharge?: number;
    levelSurcharge?: number;
    qualitySurcharge?: number;
    leakSurcharge?: number;
    overfillSurcharge?: number;
    fireSurcharge?: number;
    explosionSurcharge?: number;
    corrosionSurcharge?: number;
    stainlessSurcharge?: number;
    aluminumSurcharge?: number;
    carbonSurcharge?: number;
    fiberglassSurcharge?: number;
    plasticSurcharge?: number;
    compositeSurcharge?: number;
    insulatedSurcharge?: number;
  };
}
