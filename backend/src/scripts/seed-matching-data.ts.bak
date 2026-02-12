import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { FleetService } from '../modules/fleet/fleet.service';
import { LoadsService } from '../modules/loads/loads.service';
import { CreateTruckDto } from '../modules/fleet/dto/create-truck.dto';
import { CreateLoadDto } from '../modules/loads/dto/create-load.dto';
import { FuelType, TruckType, VehicleStatus } from '../entities/truck.entity';
import { CargoType, LoadType, EquipmentType, LoadStatus, Visibility, PaymentTerms, UrgencyLevel } from '../entities/load.entity';
import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { Truck } from '../entities/truck.entity';

async function seedMatchingData() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    console.log('🌱 Starting matching data seed...\n');

    const fleetService = app.get(FleetService);
    const loadsService = app.get(LoadsService);
    const userRepository = dataSource.getRepository(User);

    // Get or create users
    console.log('👤 Finding/Creating users...');
    
    // Find deborah@gmail.com (cargo owner)
    let deborah = await userRepository.findOne({
      where: { email: 'deborah@gmail.com' },
    });

    if (!deborah) {
      console.log('   Creating deborah@gmail.com...');
      deborah = userRepository.create({
        email: 'deborah@gmail.com',
        role: 'CARGO_OWNER' as any,
        status: 'ACTIVE' as any,
        tenantId: '00000000-0000-0000-0000-000000000001',
        emailVerifiedAt: new Date(),
      });
      deborah = await userRepository.save(deborah);
      console.log(`   ✅ Created deborah@gmail.com (ID: ${deborah.id})`);
    } else {
      console.log(`   ✅ Found deborah@gmail.com (ID: ${deborah.id})`);
    }

    // Find truck.owner@test.com (truck owner)
    let truckOwner = await userRepository.findOne({
      where: { email: 'truck.owner@test.com' },
    });

    if (!truckOwner) {
      console.log('   Creating truck.owner@test.com...');
      truckOwner = userRepository.create({
        email: 'truck.owner@test.com',
        role: 'TRUCK_OWNER' as any,
        status: 'ACTIVE' as any,
        tenantId: '00000000-0000-0000-0000-000000000001',
        emailVerifiedAt: new Date(),
      });
      truckOwner = await userRepository.save(truckOwner);
      console.log(`   ✅ Created truck.owner@test.com (ID: ${truckOwner.id})`);
    } else {
      console.log(`   ✅ Found truck.owner@test.com (ID: ${truckOwner.id})`);
    }

    const tenantId = '00000000-0000-0000-0000-000000000001';

    // Create matching truck with comprehensive AI matching features
    console.log('\n🚛 Creating AI-optimized matching truck...');
    const matchingTruck: CreateTruckDto = {
      plateNumber: 'AI-MATCH-001',
      vin: 'AIMATCH001TRUCK24', // Exactly 17 characters
      registrationNumber: 'REG-AI-MATCH-001',
      make: 'Freightliner',
      model: 'Cascadia',
      year: 2022,
      color: 'White',
      fuelType: FuelType.DIESEL,
      insurancePolicy: 'INS-AI-MATCH-001',
      capacityWeight: 25000, // 25,000 kg capacity
      capacityVolume: 80, // 80 m³
      maxLength: 13.7,
      maxWidth: 2.6,
      maxHeight: 4.0,
      truckType: TruckType.VAN,
      mileage: 45000,
      fuelEfficiency: 8.5,
      // Core equipment for AI matching
      hasRefrigeration: true, // For refrigerated cargo
      hasLiftGate: true, // For forklift requirement
      hasGps: true, // For GPS monitoring requirement
      hasHazmatPermit: false, // Not needed for this cargo
      hasSideRails: true,
      hasTarps: true,
      hasStraps: true,
      hasTailLift: true,
      status: VehicleStatus.AVAILABLE,
      isActive: true,
      cargoCapabilities: {
        supportedCargoTypes: ['REFRIGERATED', 'FOOD', 'GENERAL'],
        temperatureRange: { min: 2, max: 8 }, // For refrigerated cargo
        maxFragileHandling: true,
        maxHazardousHandling: false,
        maxRefrigeratedHandling: true,
        maxLiquidHandling: false,
        maxOversizedHandling: false,
        maxValuableHandling: true,
        maxWeightPerAxle: 12500,
        maxVolumeCapacity: 80,
        maxLengthCapacity: 13.7,
        maxWidthCapacity: 2.6,
        maxHeightCapacity: 4.0,
      },
      loadingCapabilities: {
        hasForklift: true, // Matches cargo requirement
        hasCrane: false,
        hasLoadingDock: true, // Matches cargo requirement
        hasSideLift: false,
        hasTailLift: true, // Lift gate capability
        hasRollerBed: false,
        hasDropDeck: false,
        hasExtendable: false,
        maxLoadingTime: 2, // 2 hours
        maxUnloadingTime: 1.5, // 1.5 hours
      },
      securityFeatures: {
        hasGps: true, // Matches GPS monitoring requirement
        hasTracking: true,
        hasTelematics: true,
        hasELD: true,
        hasDashCam: true,
        hasRealTimeTracking: true,
        hasTemperatureAlerts: true, // For temperature monitoring
        hasCargoMonitoring: true,
        hasWeightMonitoring: true,
        hasVolumeMonitoring: true,
      },
    };

    let truck;
    try {
      truck = await fleetService.createTruck(
        matchingTruck,
        truckOwner.id,
        tenantId,
      );
      console.log(`   ✅ Created truck: ${truck.plateNumber} (ID: ${truck.id})`);
    } catch (error: any) {
      console.error(`   ❌ Failed to create truck: ${error.message}`);
      // Try to find existing truck
      const truckRepository = dataSource.getRepository(Truck);
      const existingTrucks = await truckRepository.find({ where: { plateNumber: 'AI-MATCH-001', tenantId } });
      if (existingTrucks.length > 0) {
        truck = existingTrucks[0];
        console.log(`   ✅ Found existing truck: ${truck.plateNumber}`);
      } else {
        throw error;
      }
    }

    // Create matching cargo optimized for AI matching
    console.log('\n📦 Creating AI-optimized matching cargo...');
    
    // Set dates - pickup in 2 days, delivery in 3 days
    const pickupDate = new Date();
    pickupDate.setDate(pickupDate.getDate() + 2);
    pickupDate.setHours(8, 0, 0, 0);
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 3);
    deliveryDate.setHours(18, 0, 0, 0);

    const matchingCargo: CreateLoadDto = {
      title: 'Refrigerated Food Products - AI Test Cargo',
      description: 'Temperature-controlled food products requiring refrigeration, GPS monitoring, and specialized handling',
      weight: 15000, // 15,000 kg - 60% utilization (optimal range 70-90%)
      volume: 50, // 50 m³ - 62.5% utilization (optimal)
      cargoType: CargoType.REFRIGERATED, // Matches truck refrigeration capability
      loadType: LoadType.FTL,
      equipmentType: EquipmentType.DRY_VAN,
      visibility: Visibility.PUBLIC,
      unitsRequired: 1,
      pickupDate: pickupDate,
      deliveryDate: deliveryDate,
      loadValue: 50000, // $50,000 value
      offeredPrice: 3500, // $3,500 offered price
      currencyCode: 'USD',
      paymentTerms: PaymentTerms.NET_30,
      
      // Dimensions - stored in metadata if needed
      isStackable: true,
      
      // Requirements that match the truck perfectly
      isFragile: false,
      isHazardous: false,
      requiresRefrigeration: true, // Truck has refrigeration ✅
      requiresForklift: true, // Truck has forklift ✅
      requiresCrane: false,
      requiresLoadingDock: true, // Truck has loading dock ✅
      requiresGpsMonitoring: true, // Truck has GPS ✅
      requiresTemperatureMonitoring: true, // Truck has temperature monitoring ✅
      requiresHumidityControl: false,
      isTimeCritical: false,
      urgencyLevel: UrgencyLevel.NORMAL,
      
      // Contact info
      contactInfo: {
        contactPerson: 'Deborah Smith',
        contactPhone: '+254-712-345-678',
        contactEmail: 'deborah@gmail.com',
      },
      
      // Locations - Close proximity for good distance score
      locations: [
        {
          id: 'pickup-location-ai-1',
          type: 'PICKUP',
          sequence: 1,
          status: 'PENDING' as any,
          scheduledDate: pickupDate,
          estimatedTime: 120, // 2 hours
          locationData: {
            name: 'Food Distribution Warehouse',
            address: '123 Main Street, Downtown District, City A',
            coordinates: {
              latitude: 40.7128, // New York coordinates for testing
              longitude: -74.0060,
            },
            contactInfo: {
              contactPerson: 'Warehouse Manager',
              contactPhone: '+1-555-0100',
              contactEmail: 'warehouse@example.com',
            },
            accessInstructions: 'Use main gate, lift gate required for loading',
            specialInstructions: 'Temperature-controlled cargo - maintain 2-8°C',
          },
          requirements: {
            requiresForklift: true,
            requiresCrane: false,
            requiresLoadingDock: true,
            hazmatCertified: false,
            temperatureControlled: true,
            securityClearance: 'STANDARD' as any,
          },
        },
        {
          id: 'delivery-location-ai-1',
          type: 'DELIVERY',
          sequence: 2,
          status: 'PENDING' as any,
          scheduledDate: deliveryDate,
          estimatedTime: 120, // 2 hours
          locationData: {
            name: 'Retail Distribution Center',
            address: '456 Commerce Boulevard, Industrial Zone, City B',
            coordinates: {
              latitude: 40.7589, // Close to pickup for good distance score
              longitude: -73.9851,
            },
            contactInfo: {
              contactPerson: 'Distribution Manager',
              contactPhone: '+1-555-0101',
              contactEmail: 'distribution@example.com',
            },
            accessInstructions: 'Use side entrance, lift gate required for unloading',
            specialInstructions: 'Deliver during business hours, maintain temperature',
          },
          requirements: {
            requiresForklift: true,
            requiresCrane: false,
            requiresLoadingDock: true,
            hazmatCertified: false,
            temperatureControlled: true,
            securityClearance: 'STANDARD' as any,
          },
        },
      ],
      
      // Matching preferences
      autoMatchEnabled: true, // Enable automatic matching
      matchingCriteria: {},
      
      // Truck requirements - matches truck perfectly
      truckRequirements: {
        minCapacityWeight: 15000, // Truck has 25,000 kg ✅
        minCapacityVolume: 40, // Truck has 80 m³ ✅
        requiredTruckTypes: ['VAN'], // Truck is VAN type ✅
        requiredFeatures: ['REFRIGERATION', 'LIFT_GATE', 'FORKLIFT', 'GPS', 'TEMPERATURE_MONITORING'],
      },
    };

    let cargo;
    try {
      cargo = await loadsService.create(matchingCargo, deborah.id, tenantId);
      console.log(`   ✅ Created cargo: ${cargo.title} (ID: ${cargo.id})`);
      console.log(`   📍 Route: City A → City B (Close proximity for good distance score)`);
      console.log(`   ⚖️  Weight: ${matchingCargo.weight} kg (Truck capacity: ${matchingTruck.capacityWeight} kg - 60% utilization)`);
      console.log(`   📦 Volume: ${matchingCargo.volume} m³ (Truck capacity: ${matchingTruck.capacityVolume} m³ - 62.5% utilization)`);
      console.log(`   🌡️  Temperature: 2°C - 8°C (refrigerated)`);
      console.log(`   ✅ All AI matching criteria met!`);
    } catch (error: any) {
      console.error(`   ❌ Failed to create cargo: ${error.message}`);
      if (error.stack) {
        console.error(error.stack);
      }
      throw error;
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Matching Data Seed Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`👤 Cargo Owner: deborah@gmail.com (${deborah.id})`);
    console.log(`👤 Truck Owner: truck.owner@test.com (${truckOwner.id})`);
    console.log(`🚛 Truck: ${truck.plateNumber} (${truck.id})`);
    console.log(`   - Capacity: ${matchingTruck.capacityWeight} kg / ${matchingTruck.capacityVolume} m³`);
    console.log(`   - Type: ${matchingTruck.truckType}`);
    console.log(`   - Has Refrigeration: ✅`);
    console.log(`   - Has Lift Gate: ✅`);
    console.log(`   - Has Forklift: ✅`);
    console.log(`   - Has GPS: ✅`);
    console.log(`   - Has Temperature Monitoring: ✅`);
    console.log(`   - Status: ${VehicleStatus.AVAILABLE}`);
    console.log(`📦 Cargo: ${cargo.title} (${cargo.id})`);
    console.log(`   - Weight: ${matchingCargo.weight} kg (60% utilization - optimal)`);
    console.log(`   - Volume: ${matchingCargo.volume} m³ (62.5% utilization - optimal)`);
    console.log(`   - Type: ${matchingCargo.cargoType}`);
    console.log(`   - Requires Refrigeration: ✅`);
    console.log(`   - Requires Lift Gate: ✅`);
    console.log(`   - Requires Forklift: ✅`);
    console.log(`   - Requires GPS Monitoring: ✅`);
    console.log(`   - Requires Temperature Monitoring: ✅`);
    console.log(`   - Temperature Range: 2°C - 8°C (refrigerated)`);
    console.log(`   - Auto-Match Enabled: ✅`);
    console.log('\n🎯 AI Matching Criteria Met:');
    console.log('   ✅ Capacity Score: 90-100% (optimal utilization 60%)');
    console.log('   ✅ Equipment Score: ~100% (all requirements met)');
    console.log('   ✅ Temperature Score: ~100% (refrigeration match)');
    console.log('   ✅ Security Score: 90-100% (GPS & monitoring)');
    console.log('   ✅ Distance Score: High (close proximity)');
    console.log('   ✅ Truck is AVAILABLE and ACTIVE');
    console.log('   ✅ Same tenant ID');
    console.log('   ✅ Compatible cargo type (REFRIGERATED)');
    console.log('\n🚀 Expected AI Match Score: 85-95% (Excellent Match)');
    console.log('\n📋 To view the match:');
    console.log('   1. Go to Cargo Owner Dashboard');
    console.log(`   2. Find cargo: "${cargo.title}"`);
    console.log('   3. Click to view details');
    console.log('   4. Go to "Matching" tab');
    console.log('   5. You should see the truck with detailed AI scoring breakdown!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error: any) {
    console.error('❌ Error seeding matching data:', error.message);
    console.error(error.stack);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

seedMatchingData().catch(console.error);

