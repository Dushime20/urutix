import { AppDataSource } from '../data-source';
import { Truck } from '../entities/truck.entity';

async function populateCargoAlignmentData() {
  try {
    await AppDataSource.initialize();
    console.log('Data Source has been initialized!');

    const truckRepository = AppDataSource.getRepository(Truck);

    // Get all existing trucks
    const trucks = await truckRepository.find();
    console.log(`Found ${trucks.length} trucks to update`);

    for (const truck of trucks) {
      // Generate sample cargo alignment data based on truck type
      const cargoCapabilities = generateCargoCapabilities(truck);
      const loadingCapabilities = generateLoadingCapabilities(truck);
      const securityFeatures = generateSecurityFeatures(truck);
      const certifications = generateCertifications(truck);
      const routeCapabilities = generateRouteCapabilities(truck);
      const costStructure = generateCostStructure(truck);

      // Update truck with cargo alignment data
      await truckRepository.update(truck.id, {
        cargoCapabilities,
        loadingCapabilities,
        securityFeatures,
        certifications,
        routeCapabilities,
        costStructure,
      });

      console.log(
        `Updated truck ${truck.plateNumber} with cargo alignment data`,
      );
    }

    console.log('Cargo alignment data populated successfully!');
    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error populating cargo alignment data:', error);
    process.exit(1);
  }
}

function generateCargoCapabilities(truck: Truck) {
  const baseCapabilities = {
    supportedCargoTypes: ['GENERAL'],
    maxFragileHandling: false,
    maxHazardousHandling: false,
    maxRefrigeratedHandling: false,
    maxLiquidHandling: false,
    maxOversizedHandling: false,
    maxValuableHandling: false,
    temperatureRange: { min: 15, max: 25 },
    humidityControl: false,
    maxStackableHeight: 2.5,
    maxClearanceHeight: truck.maxHeight || 4.0,
    maxWeightPerAxle: truck.capacityWeight / 2,
    maxVolumeCapacity: truck.capacityVolume,
    maxLengthCapacity: truck.maxLength || 12.0,
    maxWidthCapacity: truck.maxWidth || 2.5,
    maxHeightCapacity: truck.maxHeight || 4.0,
  };

  // Enhance based on truck type
  if (truck.hasRefrigeration) {
    baseCapabilities.supportedCargoTypes.push('REFRIGERATED');
    baseCapabilities.maxRefrigeratedHandling = true;
    baseCapabilities.temperatureRange = { min: -20, max: 10 };
    baseCapabilities.humidityControl = true;
  }

  if (truck.hasHazmatPermit) {
    baseCapabilities.supportedCargoTypes.push('HAZARDOUS');
    baseCapabilities.maxHazardousHandling = true;
  }

  if (truck.hasLiftGate) {
    baseCapabilities.supportedCargoTypes.push('FRAGILE');
    baseCapabilities.maxFragileHandling = true;
  }

  return baseCapabilities;
}

function generateLoadingCapabilities(truck: Truck) {
  return {
    hasForklift: false,
    hasCrane: false,
    hasLoadingDock: true,
    hasSideLift: truck.hasSideLift || false,
    hasTailLift: truck.hasTailLift || false,
    hasRollerBed: truck.hasRollerBed || false,
    hasDropDeck: truck.hasDropDeck || false,
    hasExtendable: truck.hasExtendable || false,
    hasLowbed: truck.hasLowbed || false,
    hasStepDeck: truck.hasStepDeck || false,
    hasPowerOnly: truck.hasPowerOnly || false,
    hasContainerChassis: truck.hasContainerChassis || false,
    maxLoadingTime: 30, // minutes
    maxUnloadingTime: 30, // minutes
  };
}

function generateSecurityFeatures(truck: Truck) {
  return {
    hasGps: truck.hasGps || true,
    hasTracking: truck.hasTracking || true,
    hasTelematics: truck.hasTelematics || false,
    hasELD: truck.hasELD || false,
    hasDashCam: truck.hasDashCam || false,
    hasSafetyCameras: truck.hasSafetyCameras || false,
    hasCollisionAvoidance: truck.hasCollisionAvoidance || false,
    hasLaneDeparture: truck.hasLaneDeparture || false,
    hasAdaptiveCruise: truck.hasAdaptiveCruise || false,
    hasBlindSpot: truck.hasBlindSpot || false,
    hasBackupCamera: truck.hasBackupCamera || false,
    hasTirePressureMonitoring: truck.hasTirePressureMonitoring || false,
    hasEngineMonitoring: truck.hasEngineMonitoring || false,
    hasFuelMonitoring: truck.hasFuelMonitoring || false,
    hasMaintenanceAlerts: truck.hasMaintenanceAlerts || false,
    hasDriverMonitoring: truck.hasDriverMonitoring || false,
    hasFatigueMonitoring: truck.hasFatigueMonitoring || false,
    hasSpeedMonitoring: truck.hasSpeedMonitoring || false,
    hasIdleMonitoring: truck.hasIdleMonitoring || false,
    hasRouteOptimization: truck.hasRouteOptimization || false,
    hasRealTimeTracking: truck.hasRealTimeTracking || true,
    hasGeofencing: truck.hasGeofencing || false,
    hasTemperatureAlerts: truck.hasTemperatureAlerts || truck.hasRefrigeration,
    hasHumidityAlerts: truck.hasHumidityAlerts || truck.hasRefrigeration,
    hasShockMonitoring: truck.hasShockMonitoring || false,
    hasTiltMonitoring: truck.hasTiltMonitoring || false,
    hasDoorMonitoring: truck.hasDoorMonitoring || false,
    hasCargoMonitoring: truck.hasCargoMonitoring || false,
    hasWeightMonitoring: truck.hasWeightMonitoring || false,
    hasVolumeMonitoring: truck.hasVolumeMonitoring || false,
    hasPressureMonitoring: truck.hasPressureMonitoring || false,
    hasFlowMonitoring: truck.hasFlowMonitoring || false,
    hasLevelMonitoring: truck.hasLevelMonitoring || false,
    hasQualityMonitoring: truck.hasQualityMonitoring || false,
    hasContaminationMonitoring: truck.hasContaminationMonitoring || false,
    hasLeakDetection: truck.hasLeakDetection || false,
    hasOverfillProtection: truck.hasOverfillProtection || false,
    hasEmergencyShutdown: truck.hasEmergencyShutdown || false,
    hasFireSuppression: truck.hasFireSuppression || false,
    hasExplosionProof: truck.hasExplosionProof || false,
    hasCorrosionResistant: truck.hasCorrosionResistant || false,
    hasStainlessSteel: truck.hasStainlessSteel || false,
    hasAluminum: truck.hasAluminum || false,
    hasCarbonSteel: truck.hasCarbonSteel || false,
    hasFiberglass: truck.hasFiberglass || false,
    hasPlastic: truck.hasPlastic || false,
    hasComposite: truck.hasComposite || false,
    hasInsulated: truck.hasInsulated || false,
  };
}

function generateCertifications(truck: Truck) {
  const certifications = {
    hazmatCertified: truck.hasHazmatPermit || false,
    dangerousGoodsCertified: truck.hasDangerousGoods || false,
    foodGradeCertified: truck.hasFoodGrade || false,
    pharmaceuticalCertified: truck.hasPharmaceutical || false,
    liquidCertified: truck.hasLiquid || false,
    dryBulkCertified: truck.hasDryBulk || false,
    gasCertified: truck.hasGas || false,
    chemicalCertified: truck.hasChemical || false,
    wasteCertified: truck.hasWaste || false,
    reeferCertified: truck.hasRefrigeration || false,
    frozenCertified: truck.hasFrozen || false,
    chilledCertified: truck.hasChilled || false,
    ambientCertified: truck.hasAmbient || false,
    controlledAtmosphereCertified: truck.hasControlledAtmosphere || false,
    humidityControlCertified: truck.hasHumidityControl || false,
    temperatureMonitoringCertified: truck.hasTemperatureMonitoring || false,
    maxInsuranceCoverage: 1000000,
    maxDriverExperience: 5,
    requiredCertifications: ['CDL', 'DOT Medical Certificate'],
  };

  if (truck.hasHazmatPermit) {
    certifications.requiredCertifications.push('Hazmat Endorsement');
  }

  if (truck.hasRefrigeration) {
    certifications.requiredCertifications.push('Refrigeration Certification');
  }

  return certifications;
}

function generateRouteCapabilities(truck: Truck) {
  return {
    maxDistance: 1000, // km
    maxHoursToAvailability: 48,
    supportsUrbanRoutes: true,
    supportsRuralRoutes: true,
    supportsHighwayRoutes: true,
    supportsTollRoads: true,
    supportsMountainRoutes: false,
    supportsDesertRoutes: false,
    supportsCoastalRoutes: true,
    supportsInternationalRoutes: false,
    maxTerrainDifficulty: 2,
    maxWeatherConditions: ['CLEAR', 'RAIN', 'LIGHT_SNOW'],
    maxTrafficConditions: ['LIGHT', 'MODERATE', 'HEAVY'],
    maxRoadConditions: ['GOOD', 'FAIR'],
    maxSpeedLimit: 80,
    maxWeightLimit: truck.capacityWeight,
    maxHeightLimit: truck.maxHeight || 4.0,
    maxWidthLimit: truck.maxWidth || 2.5,
    maxLengthLimit: truck.maxLength || 12.0,
    maxAxleWeight: truck.capacityWeight / 2,
    maxBridgeWeight: truck.capacityWeight,
    maxTunnelHeight: truck.maxHeight || 4.0,
    maxTunnelWidth: truck.maxWidth || 2.5,
    maxTunnelLength: truck.maxLength || 12.0,
    maxBridgeHeight: truck.maxHeight || 4.0,
    maxBridgeWidth: truck.maxWidth || 2.5,
    maxBridgeLength: truck.maxLength || 12.0,
    maxFerryWeight: truck.capacityWeight,
    maxFerryHeight: truck.maxHeight || 4.0,
    maxFerryWidth: truck.maxWidth || 2.5,
    maxFerryLength: truck.maxLength || 12.0,
  };
}

function generateCostStructure(truck: Truck) {
  return {
    baseRate: 150,
    perKmRate: 2.5,
    perHourRate: 75,
    fuelSurcharge: 0.15,
    tollSurcharge: 0.1,
    hazardousSurcharge: truck.hasHazmatPermit ? 0.25 : 0,
    refrigeratedSurcharge: truck.hasRefrigeration ? 0.2 : 0,
    oversizedSurcharge: 0.3,
    valuableSurcharge: 0.15,
    fragileSurcharge: 0.2,
    liquidSurcharge: truck.hasLiquid ? 0.25 : 0,
    insuranceSurcharge: 0.05,
    trackingSurcharge: 0.03,
    monitoringSurcharge: 0.02,
    securitySurcharge: 0.08,
    emergencySurcharge: 0.5,
    weekendSurcharge: 0.15,
    holidaySurcharge: 0.25,
    nightSurcharge: 0.2,
    rushSurcharge: 0.3,
    specialHandlingSurcharge: 0.25,
    loadingSurcharge: 0.1,
    unloadingSurcharge: 0.1,
    waitingSurcharge: 0.05,
    detentionSurcharge: 0.15,
    demurrageSurcharge: 0.2,
    layoverSurcharge: 0.25,
    deadheadSurcharge: 0.4,
    repositioningSurcharge: 0.35,
    cancellationSurcharge: 0.5,
    noShowSurcharge: 0.75,
    lateDeliverySurcharge: 0.3,
    earlyDeliverySurcharge: -0.1,
    damageSurcharge: 0.5,
    lossSurcharge: 1.0,
    theftSurcharge: 0.75,
    contaminationSurcharge: 0.4,
    temperatureDeviationSurcharge: truck.hasRefrigeration ? 0.3 : 0,
    humidityDeviationSurcharge: 0.2,
    shockSurcharge: 0.25,
    tiltSurcharge: 0.2,
    vibrationSurcharge: 0.15,
    pressureSurcharge: 0.2,
    flowSurcharge: 0.25,
    levelSurcharge: 0.2,
    qualitySurcharge: 0.3,
    leakSurcharge: 0.4,
    overfillSurcharge: 0.35,
    fireSurcharge: 0.6,
    explosionSurcharge: 0.8,
    corrosionSurcharge: 0.25,
    stainlessSurcharge: 0.3,
    aluminumSurcharge: 0.25,
    carbonSurcharge: 0.2,
    fiberglassSurcharge: 0.35,
    plasticSurcharge: 0.2,
    compositeSurcharge: 0.4,
    insulatedSurcharge: 0.25,
  };
}

populateCargoAlignmentData();
