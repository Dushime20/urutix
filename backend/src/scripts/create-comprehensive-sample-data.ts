import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { FleetService } from '../modules/fleet/fleet.service';
import { BiddingService } from '../modules/bidding/bidding.service';
import { LoadsV2Service } from '../modules/loads/loads-v2.service';
import { CreateTruckDto } from '../modules/fleet/dto/create-truck.dto';
import { CreateDriverDto } from '../modules/fleet/dto/create-driver.dto';
import { FuelType, TruckType } from '../entities/truck.entity';
import { DriverStatus, EmploymentType } from '../entities/driver.entity';
import { AuctionType } from '../entities/auction.entity';
import { CreateLoadV2Dto } from '../modules/loads/dto/load-v2.dto';
import { User } from '../entities/user.entity';

async function createComprehensiveSampleData() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    console.log('✅ Application context created');

    const fleetService = app.get(FleetService);
    const biddingService = app.get(BiddingService);
    const loadsService = app.get(LoadsV2Service);

    // Default tenant and user IDs for testing
    const defaultTenantId = '00000000-0000-0000-0000-000000000001';
    const defaultUserId = '83f1b7e4-8313-4ca5-959a-fbf98f68b548';

    // Create a mock user object for the loads service
    const mockUser: Partial<User> = {
      id: defaultUserId,
      tenantId: defaultTenantId,
      email: 'test@example.com',
    };

    console.log('🚛 Creating sample trucks...');

    // Sample trucks data
    const sampleTrucks: Partial<CreateTruckDto>[] = [
      {
        plateNumber: 'ABC-123',
        vin: '1HGBH41JXMN109186',
        make: 'Ford',
        model: 'F-150',
        year: 2022,
        color: 'White',
        capacityWeight: 1500,
        capacityVolume: 2.5,
        mileage: 45000,
        fuelType: FuelType.GASOLINE,
        truckType: TruckType.FLATBED,
        insurancePolicy: 'INS-001',
        insuranceExpiry: new Date('2025-12-31'),
        registrationNumber: 'REG-001',
        registrationExpiry: new Date('2025-12-31'),
        roadworthyCertExpiry: new Date('2025-12-31'),
        hasRefrigeration: false,
        hasLiftGate: true,
        hasGps: true,
        hasHazmatPermit: false,
        cargoCapabilities: {
          supportedCargoTypes: ['GENERAL_FREIGHT', 'ELECTRONICS', 'CLOTHING'],
          temperatureRange: { min: -10, max: 30 },
          maxFragileHandling: true,
          maxHazardousHandling: false,
          maxRefrigeratedHandling: false,
          maxLiquidHandling: false,
          maxOversizedHandling: false,
          maxValuableHandling: true,
          maxWeightPerAxle: 1500,
          maxVolumeCapacity: 2.5,
          maxLengthCapacity: 16.5,
          maxWidthCapacity: 2.6,
          maxHeightCapacity: 4.1,
        },
        loadingCapabilities: {
          hasForklift: true,
          hasCrane: false,
          hasLoadingDock: false,
          hasSideLift: false,
          hasTailLift: true,
          hasRollerBed: false,
          hasDropDeck: false,
          hasExtendable: false,
          hasLowbed: false,
          hasStepDeck: false,
          hasPowerOnly: false,
          hasContainerChassis: false,
          maxLoadingTime: 30,
          maxUnloadingTime: 30,
        },
        securityFeatures: {
          hasGps: true,
          hasTracking: true,
          hasTelematics: true,
          hasELD: false,
          hasDashCam: true,
          hasSafetyCameras: true,
          hasCollisionAvoidance: false,
          hasLaneDeparture: false,
          hasAdaptiveCruise: false,
          hasBlindSpot: false,
          hasBackupCamera: true,
          hasTirePressureMonitoring: true,
          hasEngineMonitoring: true,
          hasFuelMonitoring: true,
          hasMaintenanceAlerts: true,
          hasDriverMonitoring: true,
          hasFatigueMonitoring: false,
          hasSpeedMonitoring: true,
          hasIdleMonitoring: true,
          hasRouteOptimization: true,
          hasRealTimeTracking: true,
          hasGeofencing: false,
          hasTemperatureAlerts: false,
          hasHumidityAlerts: false,
          hasShockMonitoring: false,
          hasTiltMonitoring: false,
          hasDoorMonitoring: false,
          hasCargoMonitoring: true,
          hasWeightMonitoring: true,
          hasVolumeMonitoring: true,
          hasPressureMonitoring: false,
          hasFlowMonitoring: false,
          hasLevelMonitoring: false,
          hasQualityMonitoring: false,
          hasContaminationMonitoring: false,
          hasLeakDetection: false,
          hasOverfillProtection: false,
          hasEmergencyShutdown: false,
          hasFireSuppression: false,
          hasExplosionProof: false,
          hasCorrosionResistant: false,
          hasStainlessSteel: false,
          hasAluminum: false,
          hasCarbonSteel: false,
          hasFiberglass: false,
          hasPlastic: false,
          hasComposite: false,
          hasInsulated: false,
        },
      },
      {
        plateNumber: 'XYZ-789',
        vin: '2T1BURHE0JC123456',
        make: 'Chevrolet',
        model: 'Silverado',
        year: 2023,
        color: 'Black',
        capacityWeight: 2000,
        capacityVolume: 3.0,
        mileage: 25000,
        fuelType: FuelType.DIESEL,
        truckType: TruckType.REFRIGERATED,
        insurancePolicy: 'INS-002',
        insuranceExpiry: new Date('2025-12-31'),
        registrationNumber: 'REG-002',
        registrationExpiry: new Date('2025-12-31'),
        roadworthyCertExpiry: new Date('2025-12-31'),
        hasRefrigeration: true,
        hasLiftGate: false,
        hasGps: true,
        hasHazmatPermit: false,
        cargoCapabilities: {
          supportedCargoTypes: [
            'PERISHABLE_GOODS',
            'PHARMACEUTICALS',
            'FROZEN_FOODS',
          ],
          temperatureRange: { min: -20, max: 10 },
          maxFragileHandling: false,
          maxHazardousHandling: false,
          maxRefrigeratedHandling: true,
          maxLiquidHandling: false,
          maxOversizedHandling: false,
          maxValuableHandling: false,
          maxWeightPerAxle: 2000,
          maxVolumeCapacity: 3.0,
          maxLengthCapacity: 18.0,
          maxWidthCapacity: 2.8,
          maxHeightCapacity: 4.5,
        },
        loadingCapabilities: {
          hasForklift: false,
          hasCrane: true,
          hasLoadingDock: true,
          hasSideLift: false,
          hasTailLift: false,
          hasRollerBed: false,
          hasDropDeck: false,
          hasExtendable: false,
          hasLowbed: false,
          hasStepDeck: false,
          hasPowerOnly: false,
          hasContainerChassis: false,
          maxLoadingTime: 45,
          maxUnloadingTime: 45,
        },
        securityFeatures: {
          hasGps: true,
          hasTracking: true,
          hasTelematics: true,
          hasELD: true,
          hasDashCam: true,
          hasSafetyCameras: true,
          hasCollisionAvoidance: true,
          hasLaneDeparture: true,
          hasAdaptiveCruise: true,
          hasBlindSpot: true,
          hasBackupCamera: true,
          hasTirePressureMonitoring: true,
          hasEngineMonitoring: true,
          hasFuelMonitoring: true,
          hasMaintenanceAlerts: true,
          hasDriverMonitoring: true,
          hasFatigueMonitoring: true,
          hasSpeedMonitoring: true,
          hasIdleMonitoring: true,
          hasRouteOptimization: true,
          hasRealTimeTracking: true,
          hasGeofencing: true,
          hasTemperatureAlerts: true,
          hasHumidityAlerts: true,
          hasShockMonitoring: true,
          hasTiltMonitoring: true,
          hasDoorMonitoring: true,
          hasCargoMonitoring: true,
          hasWeightMonitoring: true,
          hasVolumeMonitoring: true,
          hasPressureMonitoring: false,
          hasFlowMonitoring: false,
          hasLevelMonitoring: false,
          hasQualityMonitoring: false,
          hasContaminationMonitoring: false,
          hasLeakDetection: false,
          hasOverfillProtection: false,
          hasEmergencyShutdown: false,
          hasFireSuppression: false,
          hasExplosionProof: false,
          hasCorrosionResistant: false,
          hasStainlessSteel: false,
          hasAluminum: false,
          hasCarbonSteel: false,
          hasFiberglass: false,
          hasPlastic: false,
          hasComposite: false,
          hasInsulated: false,
        },
      },
      {
        plateNumber: 'DEF-456',
        vin: '3VWDX7AJ5DM123789',
        make: 'Volkswagen',
        model: 'Transporter',
        year: 2021,
        color: 'Blue',
        capacityWeight: 1200,
        capacityVolume: 2.0,
        mileage: 60000,
        fuelType: FuelType.DIESEL,
        truckType: TruckType.BOX_TRUCK,
        insurancePolicy: 'INS-003',
        insuranceExpiry: new Date('2025-12-31'),
        registrationNumber: 'REG-003',
        registrationExpiry: new Date('2025-12-31'),
        roadworthyCertExpiry: new Date('2025-12-31'),
        hasRefrigeration: false,
        hasLiftGate: false,
        hasGps: true,
        hasHazmatPermit: false,
        cargoCapabilities: {
          supportedCargoTypes: [
            'GENERAL_FREIGHT',
            'DOCUMENTS',
            'SMALL_PACKAGES',
          ],
          temperatureRange: { min: -5, max: 35 },
          maxFragileHandling: true,
          maxHazardousHandling: false,
          maxRefrigeratedHandling: false,
          maxLiquidHandling: false,
          maxOversizedHandling: false,
          maxValuableHandling: true,
          maxWeightPerAxle: 1200,
          maxVolumeCapacity: 2.0,
          maxLengthCapacity: 14.0,
          maxWidthCapacity: 2.4,
          maxHeightCapacity: 3.8,
        },
        loadingCapabilities: {
          hasForklift: true,
          hasCrane: false,
          hasLoadingDock: false,
          hasSideLift: false,
          hasTailLift: false,
          hasRollerBed: false,
          hasDropDeck: false,
          hasExtendable: false,
          hasLowbed: false,
          hasStepDeck: false,
          hasPowerOnly: false,
          hasContainerChassis: false,
          maxLoadingTime: 25,
          maxUnloadingTime: 25,
        },
        securityFeatures: {
          hasGps: true,
          hasTracking: true,
          hasTelematics: true,
          hasELD: false,
          hasDashCam: true,
          hasSafetyCameras: true,
          hasCollisionAvoidance: false,
          hasLaneDeparture: false,
          hasAdaptiveCruise: false,
          hasBlindSpot: false,
          hasBackupCamera: true,
          hasTirePressureMonitoring: true,
          hasEngineMonitoring: true,
          hasFuelMonitoring: true,
          hasMaintenanceAlerts: true,
          hasDriverMonitoring: true,
          hasFatigueMonitoring: false,
          hasSpeedMonitoring: true,
          hasIdleMonitoring: true,
          hasRouteOptimization: true,
          hasRealTimeTracking: true,
          hasGeofencing: false,
          hasTemperatureAlerts: false,
          hasHumidityAlerts: false,
          hasShockMonitoring: false,
          hasTiltMonitoring: false,
          hasDoorMonitoring: false,
          hasCargoMonitoring: true,
          hasWeightMonitoring: true,
          hasVolumeMonitoring: true,
          hasPressureMonitoring: false,
          hasFlowMonitoring: false,
          hasLevelMonitoring: false,
          hasQualityMonitoring: false,
          hasContaminationMonitoring: false,
          hasLeakDetection: false,
          hasOverfillProtection: false,
          hasEmergencyShutdown: false,
          hasFireSuppression: false,
          hasExplosionProof: false,
          hasCorrosionResistant: false,
          hasStainlessSteel: false,
          hasAluminum: false,
          hasCarbonSteel: false,
          hasFiberglass: false,
          hasPlastic: false,
          hasComposite: false,
          hasInsulated: false,
        },
      },
    ];

    const createdTrucks = [];
    for (const truckData of sampleTrucks) {
      try {
        const truck = await fleetService.createTruck(
          truckData as CreateTruckDto,
          defaultUserId,
          defaultTenantId,
        );
        createdTrucks.push(truck);
        console.log(
          `✅ Created truck: ${truck.plateNumber} - ${truck.make} ${truck.model}`,
        );
      } catch (error) {
        console.error(
          `❌ Failed to create truck ${truckData.plateNumber}:`,
          error.message,
        );
      }
    }

    console.log('\n👨‍💼 Creating sample drivers...');

    // Sample drivers data
    const sampleDrivers: Partial<CreateDriverDto>[] = [
      {
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@fleet.com',
        phone: '+1-555-0101',
        dateOfBirth: new Date('1985-03-15'),
        address: '123 Main St, Anytown, USA',
        licenseNumber: 'DL-001-2023',
        licenseIssueDate: new Date('2023-01-15'),
        licenseExpiry: new Date('2028-01-15'),
        licenseState: 'California',
        licenseCountry: 'USA',
        employmentType: EmploymentType.FULL_TIME,
        hireDate: new Date('2023-02-01'),
        status: DriverStatus.ACTIVE,
        hourlyRate: 25,
        mileageRate: 0.65,
      },
      {
        firstName: 'Maria',
        lastName: 'Garcia',
        email: 'maria.garcia@fleet.com',
        phone: '+1-555-0202',
        dateOfBirth: new Date('1990-07-22'),
        address: '456 Oak Ave, Somewhere, USA',
        licenseNumber: 'DL-002-2023',
        licenseIssueDate: new Date('2023-03-20'),
        licenseExpiry: new Date('2028-03-20'),
        licenseState: 'Texas',
        licenseCountry: 'USA',
        employmentType: EmploymentType.FULL_TIME,
        hireDate: new Date('2023-04-01'),
        status: DriverStatus.ACTIVE,
        hourlyRate: 22,
        mileageRate: 0.58,
      },
      {
        firstName: 'Robert',
        lastName: 'Johnson',
        email: 'robert.johnson@fleet.com',
        phone: '+1-555-0303',
        dateOfBirth: new Date('1988-11-08'),
        address: '789 Pine St, Elsewhere, USA',
        licenseNumber: 'DL-003-2023',
        licenseIssueDate: new Date('2023-05-10'),
        licenseExpiry: new Date('2028-05-10'),
        licenseState: 'Florida',
        licenseCountry: 'USA',
        employmentType: EmploymentType.CONTRACT,
        hireDate: new Date('2023-06-01'),
        status: DriverStatus.ACTIVE,
        hourlyRate: 28,
        mileageRate: 0.72,
      },
    ];

    const createdDrivers = [];
    for (const driverData of sampleDrivers) {
      try {
        const driver = await fleetService.createDriver(
          driverData as CreateDriverDto,
          defaultUserId,
          defaultTenantId,
        );
        createdDrivers.push(driver);
        console.log(
          `✅ Created driver: ${driver.firstName} ${driver.lastName}`,
        );
      } catch (error) {
        console.error(
          `❌ Failed to create driver ${driverData.firstName} ${driverData.lastName}:`,
          error.message,
        );
      }
    }

    console.log('\n📦 Creating sample loads...');

    // Sample loads data using CreateLoadV2Dto
    const sampleLoads: Partial<CreateLoadV2Dto>[] = [
      {
        title: 'Electronics Shipment',
        description: 'High-value electronics requiring careful handling',
        weight: 1200,
        volume: 8.0,
        cargoType: 'ELECTRONICS' as any, // Using string for V2 DTO
        loadValue: 50000,
        offeredPrice: 2500,
        currencyCode: 'USD',
        isFragile: true,
        isHazardous: false,
        requiresRefrigeration: false,
        pickupDate: new Date(
          Date.now() + 2 * 24 * 60 * 60 * 1000,
        ).toISOString(), // 2 days from now
        deliveryDate: new Date(
          Date.now() + 4 * 24 * 60 * 60 * 1000,
        ).toISOString(), // 4 days from now
        urgencyLevel: 'HIGH' as any,
        isTimeCritical: true,
        length: 2.5,
        width: 1.8,
        height: 1.2,
        isStackable: false,
        requiresGpsMonitoring: true,
        requiresTemperatureMonitoring: false,
        insuranceValue: 50000,
        specialHandlingInstructions:
          'Handle with extreme care. No stacking allowed.',
        loadingInstructions: 'Use forklift with care. No sudden movements.',
        unloadingInstructions:
          'Unload carefully. Check for damage before signing.',
        pickupLocationId: '00000000-0000-0000-0000-000000000001', // Mock location ID
        deliveryLocationId: '00000000-0000-0000-0000-000000000002', // Mock location ID
      },
      {
        title: 'Furniture Delivery',
        description: 'Office furniture for new office setup',
        weight: 800,
        volume: 12.0,
        cargoType: 'GENERAL' as any,
        loadValue: 8000,
        offeredPrice: 1200,
        currencyCode: 'USD',
        isFragile: false,
        isHazardous: false,
        requiresRefrigeration: false,
        pickupDate: new Date(
          Date.now() + 3 * 24 * 60 * 60 * 1000,
        ).toISOString(), // 3 days from now
        deliveryDate: new Date(
          Date.now() + 5 * 24 * 60 * 60 * 1000,
        ).toISOString(), // 5 days from now
        urgencyLevel: 'NORMAL' as any,
        isTimeCritical: false,
        length: 3.0,
        width: 2.0,
        height: 2.0,
        isStackable: true,
        requiresGpsMonitoring: false,
        requiresTemperatureMonitoring: false,
        insuranceValue: 10000,
        specialHandlingInstructions: 'Standard handling. Can be stacked.',
        loadingInstructions: 'Load with care. Stack if possible.',
        unloadingInstructions: 'Unload carefully. Check for damage.',
        pickupLocationId: '00000000-0000-0000-0000-000000000003', // Mock location ID
        deliveryLocationId: '00000000-0000-0000-0000-000000000004', // Mock location ID
      },
      {
        title: 'Refrigerated Food Items',
        description: 'Fresh produce requiring temperature control',
        weight: 2000,
        volume: 15.0,
        cargoType: 'REFRIGERATED' as any,
        loadValue: 15000,
        offeredPrice: 2800,
        currencyCode: 'USD',
        isFragile: false,
        isHazardous: false,
        requiresRefrigeration: true,
        pickupDate: new Date(
          Date.now() + 1 * 24 * 60 * 60 * 1000,
        ).toISOString(), // 1 day from now
        deliveryDate: new Date(
          Date.now() + 3 * 24 * 60 * 60 * 1000,
        ).toISOString(), // 3 days from now
        urgencyLevel: 'CRITICAL' as any,
        isTimeCritical: true,
        length: 4.0,
        width: 2.5,
        height: 1.5,
        isStackable: false,
        requiresGpsMonitoring: true,
        requiresTemperatureMonitoring: true,
        temperatureMin: 2,
        temperatureMax: 8,
        insuranceValue: 20000,
        specialHandlingInstructions:
          'Maintain temperature between 2-8°C at all times.',
        loadingInstructions:
          'Pre-cool truck before loading. Load quickly to maintain temperature.',
        unloadingInstructions:
          'Unload quickly. Check temperature before accepting delivery.',
        pickupLocationId: '00000000-0000-0000-0000-000000000005', // Mock location ID
        deliveryLocationId: '00000000-0000-0000-0000-000000000006', // Mock location ID
      },
    ];

    const createdLoads = [];
    for (const loadData of sampleLoads) {
      try {
        const load = await loadsService.create(
          loadData as CreateLoadV2Dto,
          mockUser as User,
        );
        createdLoads.push(load);
        console.log(`✅ Created load: ${load.title}`);
      } catch (error) {
        console.error(
          `❌ Failed to create load ${loadData.title}:`,
          error.message,
        );
      }
    }

    console.log('\n🏷️ Creating sample auctions...');

    // Create auctions for the published loads
    for (const load of createdLoads) {
      try {
        const auction = await biddingService.createAuction(
          {
            loadId: load.id,
            auctionType: AuctionType.REVERSE,
            auctionStart: new Date(),
            auctionEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            reservePrice: load.offeredPrice * 0.8, // 80% of offered price
            minimumBidIncrement: 50,
            maximumBidAmount: load.offeredPrice * 1.2, // 120% of offered price
            auctionRules: {
              allowCounterOffers: true,
              allowBidModifications: true,
              autoExtendOnBid: true,
              extensionMinutes: 15,
              minimumBidTime: 30,
              maximumBidTime: 1440, // 24 hours
              requirePreApproval: false,
              allowAnonymousBids: false,
            },
            notificationSettings: {
              notifyOnBid: true,
              notifyOnCounterOffer: true,
              notifyOnAuctionEnd: true,
              notifyOnAward: true,
              emailNotifications: true,
              smsNotifications: false,
              pushNotifications: true,
            },
          },
          defaultUserId,
          defaultTenantId,
        );
        console.log(`✅ Created auction for load: ${load.title}`);
      } catch (error) {
        console.error(
          `❌ Failed to create auction for load ${load.title}:`,
          error.message,
        );
      }
    }

    console.log('\n🎉 Comprehensive sample data creation completed!');
    console.log(`\n📊 Summary:`);
    console.log(`- Trucks created: ${createdTrucks.length}`);
    console.log(`- Drivers created: ${createdDrivers.length}`);
    console.log(`- Loads created: ${createdLoads.length}`);
    console.log(`- Auctions created: ${createdLoads.length}`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await app.close();
  }
}

createComprehensiveSampleData();
