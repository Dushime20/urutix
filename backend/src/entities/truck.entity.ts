import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { User } from './user.entity';

export enum VehicleStatus {
  AVAILABLE = 'AVAILABLE',
  IN_TRANSIT = 'IN_TRANSIT',
  MAINTENANCE = 'MAINTENANCE',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE',
}

export enum FuelType {
  DIESEL = 'DIESEL',
  GASOLINE = 'GASOLINE',
  ELECTRIC = 'ELECTRIC',
  HYBRID = 'HYBRID',
  CNG = 'CNG',
  LNG = 'LNG',
}

export enum TruckType {
  FLATBED = 'FLATBED',
  BOX_TRUCK = 'BOX_TRUCK',
  TANKER = 'TANKER',
  REFRIGERATED = 'REFRIGERATED',
  CONTAINER = 'CONTAINER',
  CAR_CARRIER = 'CAR_CARRIER',
  HEAVY_HAUL = 'HEAVY_HAUL',
  LOWBED = 'LOWBED',
  STEP_DECK = 'STEP_DECK',
  POWER_ONLY = 'POWER_ONLY',
  CURTAIN_SIDE = 'CURTAIN_SIDE',
  VAN = 'VAN',
  PLATFORM = 'PLATFORM',
  BULK = 'BULK',
  DUMP = 'DUMP',
  CEMENT_MIXER = 'CEMENT_MIXER',
  CRANE = 'CRANE',
  FIRE_TRUCK = 'FIRE_TRUCK',
  AMBULANCE = 'AMBULANCE',
  TOW_TRUCK = 'TOW_TRUCK',
  GARBAGE = 'GARBAGE',
  MILITARY = 'MILITARY',
  SPECIALIZED = 'SPECIALIZED',
}

export enum TrailerType {
  FLATBED = 'FLATBED',
  DRY_VAN = 'DRY_VAN',
  REFRIGERATED = 'REFRIGERATED',
  TANKER = 'TANKER',
  BULK = 'BULK',
  CONTAINER = 'CONTAINER',
  CAR_CARRIER = 'CAR_CARRIER',
  HEAVY_HAUL = 'HEAVY_HAUL',
  LOWBED = 'LOWBED',
  STEP_DECK = 'STEP_DECK',
  POWER_ONLY = 'POWER_ONLY',
  CURTAIN_SIDE = 'CURTAIN_SIDE',
  PLATFORM = 'PLATFORM',
  DUMP = 'DUMP',
  CEMENT_MIXER = 'CEMENT_MIXER',
  CRANE = 'CRANE',
  SPECIALIZED = 'SPECIALIZED',
}

@Entity('trucks')
@Index(['tenantId', 'plateNumber'], {
  unique: true,
  where: 'deleted_at IS NULL',
})
@Index(['ownerId', 'status'])
@Index(['status', 'currentTripId'])
@Index(['truckType', 'capacityWeight'])
export class Truck {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @Column('uuid')
  ownerId: string;

  @Column({ length: 20 })
  plateNumber: string;

  @Column({ length: 17, unique: true })
  vin: string;

  @Column({ length: 100 })
  make: string;

  @Column({ length: 100 })
  model: string;

  @Column()
  year: number;

  @Column({ length: 50, nullable: true })
  color?: string;

  @Column({
    type: 'enum',
    enum: FuelType,
    default: FuelType.DIESEL,
  })
  fuelType: FuelType;

  @Column('decimal', { precision: 10, scale: 2 })
  capacityWeight: number;

  @Column('decimal', { precision: 10, scale: 2 })
  capacityVolume: number;

  @Column('decimal', { precision: 8, scale: 2, nullable: true })
  maxLength?: number;

  @Column('decimal', { precision: 8, scale: 2, nullable: true })
  maxWidth?: number;

  @Column('decimal', { precision: 8, scale: 2, nullable: true })
  maxHeight?: number;

  // Cargo-specific specifications
  @Column({
    type: 'enum',
    enum: TruckType,
    default: TruckType.FLATBED,
  })
  truckType: TruckType;

  @Column({
    type: 'enum',
    enum: TrailerType,
    nullable: true,
  })
  trailerType?: TrailerType;

  // Essential cargo equipment
  @Column({ default: false })
  hasSideRails: boolean;

  @Column({ default: false })
  hasTarps: boolean;

  @Column({ default: false })
  hasStraps: boolean;

  @Column({ default: false })
  hasChains: boolean;

  @Column({ default: false })
  hasWinch: boolean;

  @Column({ default: false })
  hasRam: boolean;

  @Column({ default: false })
  hasTailLift: boolean;

  @Column({ default: false })
  hasSideLift: boolean;

  @Column({ default: false })
  hasRollerBed: boolean;

  @Column({ default: false })
  hasDropDeck: boolean;

  @Column({ default: false })
  hasExtendable: boolean;

  @Column({ default: false })
  hasLowbed: boolean;

  @Column({ default: false })
  hasStepDeck: boolean;

  @Column({ default: false })
  hasPowerOnly: boolean;

  @Column({ default: false })
  hasContainerChassis: boolean;

  // Cargo type capabilities
  @Column({ default: false })
  hasTanker: boolean;

  @Column({ default: false })
  hasBulk: boolean;

  @Column({ default: false })
  hasRefrigerated: boolean;

  @Column({ default: false })
  hasHeated: boolean;

  @Column({ default: false })
  hasVentilated: boolean;

  @Column({ default: false })
  hasCurtainSide: boolean;

  @Column({ default: false })
  hasBox: boolean;

  @Column({ default: false })
  hasVan: boolean;

  @Column({ default: false })
  hasPlatform: boolean;

  @Column({ default: false })
  hasCarCarrier: boolean;

  @Column({ default: false })
  hasHeavyHaul: boolean;

  @Column({ default: false })
  hasOversized: boolean;

  // Specialized cargo capabilities
  @Column({ default: false })
  hasHazmat: boolean;

  @Column({ default: false })
  hasDangerousGoods: boolean;

  @Column({ default: false })
  hasFoodGrade: boolean;

  @Column({ default: false })
  hasPharmaceutical: boolean;

  @Column({ default: false })
  hasLiquid: boolean;

  @Column({ default: false })
  hasDryBulk: boolean;

  @Column({ default: false })
  hasGas: boolean;

  @Column({ default: false })
  hasChemical: boolean;

  @Column({ default: false })
  hasWaste: boolean;

  // Temperature control
  @Column({ default: false })
  hasReefer: boolean;

  @Column({ default: false })
  hasFrozen: boolean;

  @Column({ default: false })
  hasChilled: boolean;

  @Column({ default: false })
  hasAmbient: boolean;

  @Column({ default: false })
  hasControlledAtmosphere: boolean;

  @Column({ default: false })
  hasHumidityControl: boolean;

  @Column({ default: false })
  hasTemperatureMonitoring: boolean;

  // Technology and tracking
  @Column({ default: false })
  hasGPS: boolean;

  @Column({ default: false })
  hasTracking: boolean;

  @Column({ default: false })
  hasTelematics: boolean;

  @Column({ default: false })
  hasELD: boolean;

  @Column({ default: false })
  hasDashCam: boolean;

  @Column({ default: false })
  hasSafetyCameras: boolean;

  // Safety features
  @Column({ default: false })
  hasCollisionAvoidance: boolean;

  @Column({ default: false })
  hasLaneDeparture: boolean;

  @Column({ default: false })
  hasAdaptiveCruise: boolean;

  @Column({ default: false })
  hasBlindSpot: boolean;

  @Column({ default: false })
  hasBackupCamera: boolean;

  // Monitoring systems
  @Column({ default: false })
  hasTirePressureMonitoring: boolean;

  @Column({ default: false })
  hasEngineMonitoring: boolean;

  @Column({ default: false })
  hasFuelMonitoring: boolean;

  @Column({ default: false })
  hasMaintenanceAlerts: boolean;

  @Column({ default: false })
  hasDriverMonitoring: boolean;

  @Column({ default: false })
  hasFatigueMonitoring: boolean;

  @Column({ default: false })
  hasSpeedMonitoring: boolean;

  @Column({ default: false })
  hasIdleMonitoring: boolean;

  // Route and tracking
  @Column({ default: false })
  hasRouteOptimization: boolean;

  @Column({ default: false })
  hasRealTimeTracking: boolean;

  @Column({ default: false })
  hasGeofencing: boolean;

  // Cargo monitoring
  @Column({ default: false })
  hasTemperatureAlerts: boolean;

  @Column({ default: false })
  hasHumidityAlerts: boolean;

  @Column({ default: false })
  hasShockMonitoring: boolean;

  @Column({ default: false })
  hasTiltMonitoring: boolean;

  @Column({ default: false })
  hasDoorMonitoring: boolean;

  @Column({ default: false })
  hasCargoMonitoring: boolean;

  @Column({ default: false })
  hasWeightMonitoring: boolean;

  @Column({ default: false })
  hasVolumeMonitoring: boolean;

  // Specialized monitoring
  @Column({ default: false })
  hasPressureMonitoring: boolean;

  @Column({ default: false })
  hasFlowMonitoring: boolean;

  @Column({ default: false })
  hasLevelMonitoring: boolean;

  @Column({ default: false })
  hasQualityMonitoring: boolean;

  @Column({ default: false })
  hasContaminationMonitoring: boolean;

  // Safety systems
  @Column({ default: false })
  hasLeakDetection: boolean;

  @Column({ default: false })
  hasOverfillProtection: boolean;

  @Column({ default: false })
  hasEmergencyShutdown: boolean;

  @Column({ default: false })
  hasFireSuppression: boolean;

  @Column({ default: false })
  hasExplosionProof: boolean;

  // Material specifications
  @Column({ default: false })
  hasCorrosionResistant: boolean;

  @Column({ default: false })
  hasStainlessSteel: boolean;

  @Column({ default: false })
  hasAluminum: boolean;

  @Column({ default: false })
  hasCarbonSteel: boolean;

  @Column({ default: false })
  hasFiberglass: boolean;

  @Column({ default: false })
  hasPlastic: boolean;

  @Column({ default: false })
  hasComposite: boolean;

  @Column({ default: false })
  hasInsulated: boolean;

  // Cargo-specific alignment fields
  @Column('jsonb', { default: {} })
  cargoCapabilities: {
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

  @Column('jsonb', { default: {} })
  loadingCapabilities: {
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
    maxLoadingTime?: number; // minutes
    maxUnloadingTime?: number; // minutes
  };

  @Column('jsonb', { default: {} })
  securityFeatures: {
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

  @Column('jsonb', { default: {} })
  certifications: {
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

  @Column('jsonb', { default: {} })
  routeCapabilities: {
    maxDistance?: number; // km
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

  @Column('jsonb', { default: {} })
  costStructure: {
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

  @Column({
    type: 'enum',
    enum: VehicleStatus,
    default: VehicleStatus.AVAILABLE,
  })
  status: VehicleStatus;

  @Column('geometry', {
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  currentLocation?: object;

  @Column({ name: 'current_address', nullable: true })
  currentAddress?: string;

  @Column({ nullable: true })
  locationUpdatedAt?: Date;

  @Column({ length: 50 })
  registrationNumber: string;

  @Column('date')
  registrationExpiry: Date;

  @Column({ length: 50 })
  insurancePolicy: string;

  @Column('date')
  insuranceExpiry: Date;

  @Column('date', { nullable: true })
  roadworthyCertExpiry?: Date;

  @Column({ default: false })
  hasRefrigeration: boolean;

  @Column({ default: false })
  hasLiftGate: boolean;

  @Column({ default: false })
  hasGps: boolean;

  @Column({ default: false })
  hasHazmatPermit: boolean;

  @Column('jsonb', { default: [] })
  equipmentList: any[];

  @Column('date', { nullable: true })
  lastMaintenanceDate?: Date;

  @Column('date', { nullable: true })
  nextMaintenanceDate?: Date;

  @Column({ default: 0 })
  mileage: number;

  @Column('jsonb', { default: [] })
  maintenanceAlerts: any[];

  @Column('jsonb', { default: [] })
  inspectionAlerts: any[];

  @Column('jsonb', { default: [] })
  insuranceAlerts: any[];

  @Column('jsonb', { default: [] })
  fuelAlerts: any[];

  @Column('jsonb', { default: [] })
  tireAlerts: any[];

  @Column('jsonb', { default: [] })
  complianceAlerts: any[];

  @Column('jsonb', { default: [] })
  assignedDrivers: any[];

  @Column('jsonb', { default: [] })
  assignedRoutes: any[];

  @Column({ default: 0 })
  totalTrips: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  totalRevenue: number;

  @Column('decimal', { precision: 8, scale: 2, nullable: true })
  fuelEfficiency?: number;

  @Column('decimal', { precision: 3, scale: 2, default: 0 })
  averageRating: number;

  @Column('uuid', { nullable: true })
  currentDriverId?: string;

  @Column('uuid', { nullable: true })
  currentTripId?: string;

  @Column('timestamp', { nullable: true })
  estimatedAvailableTime?: Date;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;

  // Relations
  @ManyToOne('User', 'trucks')
  owner: User;
}
