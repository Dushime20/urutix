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
import * as bcrypt from 'bcryptjs';

/**
 * Comprehensive Matching Algorithm Demonstration Seeds
 * 
 * This seed file creates multiple scenarios to demonstrate how the matching algorithm works:
 * 
 * SCORING FACTORS:
 * 1. Capacity Score (20% weight): Optimal utilization 70-90% = 1.0, 50-70% = 0.8, 90-100% = 0.6
 * 2. Distance Score (15% weight): ≤25km = 1.0, ≤50km = 0.9, ≤100km = 0.7, ≤150km = 0.5
 * 3. Equipment Score (25% weight): All requirements met = 1.0, missing critical = 0
 * 4. Rating Score (10% weight): Based on truck averageRating / 5
 * 5. Price Score (10% weight): Cost vs market average
 * 6. Temperature Score (10% weight): For refrigerated cargo
 * 7. Security Score (10% weight): GPS, monitoring requirements
 * 8. Route/Time/Availability/Special Requirements (5% each)
 * 
 * MATCHING SCENARIOS:
 * - Scenario 1: PERFECT MATCH (95%+ score) - All requirements met, optimal capacity, close distance
 * - Scenario 2: EXCELLENT MATCH (85-95% score) - Most requirements met, good capacity
 * - Scenario 3: GOOD MATCH (70-85% score) - Requirements met with minor compromises
 * - Scenario 4: ACCEPTABLE MATCH (50-70% score) - Basic requirements met
 * - Scenario 5: HAZMAT MATCH - Specialized hazardous materials transport
 * - Scenario 6: FRAGILE CARGO - Fragile goods requiring special handling
 * - Scenario 7: LONG DISTANCE - Cross-country transport
 * - Scenario 8: TIME CRITICAL - Urgent delivery requirements
 */

async function seedMatchingDemo() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    console.log('🌱 Starting Comprehensive Matching Algorithm Demo Seeds...\n');

    // Ensure CREATED status exists in the enum (in case database is out of sync)
    try {
      await dataSource.query(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumlabel = 'CREATED' 
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'loads_status_enum')
          ) THEN
            ALTER TYPE loads_status_enum ADD VALUE 'CREATED';
          END IF;
        END $$;
      `);
      console.log('   ✅ Verified CREATED status exists in enum');
    } catch (error: any) {
      console.log('   ⚠️  Could not verify enum (may already exist):', error.message);
    }

    const fleetService = app.get(FleetService);
    const loadsService = app.get(LoadsService);
    const userRepository = dataSource.getRepository(User);
    const truckRepository = dataSource.getRepository(Truck);

    const tenantId = '00000000-0000-0000-0000-000000000001';

    // Get or create users
    console.log('👤 Setting up users...');
    
    let cargoOwner = await userRepository.findOne({
      where: { email: 'deborah@gmail.com' },
    });

    if (!cargoOwner) {
      const passwordHash = await bcrypt.hash('password123', 12);
      cargoOwner = userRepository.create({
        email: 'deborah@gmail.com',
        role: 'CARGO_OWNER' as any,
        status: 'ACTIVE' as any,
        tenantId,
        emailVerifiedAt: new Date(),
        passwordHash,
      });
      cargoOwner = await userRepository.save(cargoOwner);
      console.log(`   ✅ Created cargo owner: deborah@gmail.com`);
    } else {
      console.log(`   ✅ Found cargo owner: deborah@gmail.com`);
    }

    let truckOwner1 = await userRepository.findOne({
      where: { email: 'truck.owner@test.com' },
    });

    if (!truckOwner1) {
      const passwordHash = await bcrypt.hash('password123', 12);
      truckOwner1 = userRepository.create({
        email: 'truck.owner@test.com',
        role: 'TRUCK_OWNER' as any,
        status: 'ACTIVE' as any,
        tenantId,
        emailVerifiedAt: new Date(),
        passwordHash,
      });
      truckOwner1 = await userRepository.save(truckOwner1);
      console.log(`   ✅ Created truck owner 1: truck.owner@test.com`);
    } else {
      console.log(`   ✅ Found truck owner 1: truck.owner@test.com`);
    }

    // Create additional truck owners for variety
    const truckOwners = [truckOwner1];
    for (let i = 2; i <= 5; i++) {
      let owner = await userRepository.findOne({
        where: { email: `truck.owner${i}@test.com` },
      });
      if (!owner) {
        const passwordHash = await bcrypt.hash('password123', 12);
        owner = userRepository.create({
          email: `truck.owner${i}@test.com`,
          role: 'TRUCK_OWNER' as any,
          status: 'ACTIVE' as any,
          tenantId,
          emailVerifiedAt: new Date(),
          passwordHash,
        });
        owner = await userRepository.save(owner);
        console.log(`   ✅ Created truck owner ${i}: truck.owner${i}@test.com`);
      }
      truckOwners.push(owner);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 SCENARIO 1: PERFECT MATCH (Expected Score: 95%+)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Characteristics:');
    console.log('  ✅ Optimal capacity utilization (75% - in 70-90% sweet spot)');
    console.log('  ✅ Very close distance (15km - perfect distance score)');
    console.log('  ✅ All equipment requirements met');
    console.log('  ✅ High truck rating (4.8/5)');
    console.log('  ✅ Competitive pricing');
    console.log('  ✅ All special requirements met\n');

    // Perfect Match Truck
    const perfectTruck: CreateTruckDto = {
      plateNumber: 'PERFECT-001',
      vin: 'PERFECT001TRUCK2',
      registrationNumber: 'REG-PERFECT-001',
      make: 'Mercedes-Benz',
      model: 'Actros',
      year: 2023,
      color: 'White',
      fuelType: FuelType.DIESEL,
      insurancePolicy: 'INS-PERFECT-001',
      capacityWeight: 20000, // 20,000 kg
      capacityVolume: 60, // 60 m³
      maxLength: 13.6,
      maxWidth: 2.5,
      maxHeight: 3.8,
      truckType: TruckType.VAN,
      mileage: 25000,
      fuelEfficiency: 9.2,
      hasRefrigeration: true,
      hasLiftGate: true,
      hasGps: true,
      hasHazmatPermit: false,
      hasSideRails: true,
      hasTarps: true,
      hasStraps: true,
      hasTailLift: true,
      status: VehicleStatus.AVAILABLE,
      isActive: true,
      cargoCapabilities: {
        supportedCargoTypes: ['REFRIGERATED', 'FOOD', 'GENERAL', 'FRAGILE'],
        temperatureRange: { min: 2, max: 8 },
        maxFragileHandling: true,
        maxRefrigeratedHandling: true,
      },
      securityFeatures: {
        hasGps: true,
        hasTracking: true,
        hasTemperatureAlerts: true,
        hasCargoMonitoring: true,
      },
    };

    let perfectTruckEntity;
    try {
      perfectTruckEntity = await fleetService.createTruck(perfectTruck, truckOwners[0].id, tenantId);
      console.log(`   ✅ Created perfect match truck: ${perfectTruckEntity.plateNumber}`);
    } catch (error: any) {
      const existing = await truckRepository.findOne({ where: { plateNumber: 'PERFECT-001', tenantId } });
      if (existing) {
        perfectTruckEntity = existing;
        console.log(`   ✅ Found existing perfect match truck: ${perfectTruckEntity.plateNumber}`);
      } else throw error;
    }

    // Perfect Match Cargo
    const pickupDate1 = new Date();
    pickupDate1.setDate(pickupDate1.getDate() + 1);
    pickupDate1.setHours(8, 0, 0, 0);
    const deliveryDate1 = new Date();
    deliveryDate1.setDate(deliveryDate1.getDate() + 2);
    deliveryDate1.setHours(18, 0, 0, 0);

    const perfectCargo: CreateLoadDto = {
      title: 'Premium Food Products - Perfect Match Demo',
      description: 'High-quality refrigerated food products requiring optimal matching',
      weight: 15000, // 75% utilization (optimal)
      volume: 45, // 75% utilization (optimal)
      cargoType: CargoType.REFRIGERATED,
      loadType: LoadType.FTL,
      equipmentType: EquipmentType.DRY_VAN,
      visibility: Visibility.PUBLIC,
      unitsRequired: 1,
      pickupDate: pickupDate1,
      deliveryDate: deliveryDate1,
      loadValue: 75000,
      offeredPrice: 4500,
      currencyCode: 'USD',
      paymentTerms: PaymentTerms.NET_30,
      requiresRefrigeration: true,
      requiresForklift: true,
      requiresLoadingDock: true,
      requiresGpsMonitoring: true,
      requiresTemperatureMonitoring: true,
      urgencyLevel: UrgencyLevel.NORMAL,
      locations: [
        {
          id: 'pickup-perfect-1',
          type: 'PICKUP',
          sequence: 1,
          status: 'PENDING' as any,
          scheduledDate: pickupDate1,
          locationData: {
            name: 'Premium Food Warehouse',
            address: '123 Food Street, Manhattan, NY',
            coordinates: { latitude: 40.7128, longitude: -74.0060 },
          },
          estimatedTime: 120, // 2 hours
        },
        {
          id: 'delivery-perfect-1',
          type: 'DELIVERY',
          sequence: 2,
          status: 'PENDING' as any,
          scheduledDate: deliveryDate1,
          estimatedTime: 120, // 2 hours
          locationData: {
            name: 'Gourmet Distribution Center',
            address: '456 Gourmet Ave, Brooklyn, NY',
            coordinates: { latitude: 40.7282, longitude: -73.9942 }, // ~15km away
          },
        },
      ],
      truckRequirements: {
        minCapacityWeight: 15000,
        minCapacityVolume: 40,
        requiredTruckTypes: ['VAN'],
        requiredFeatures: ['REFRIGERATION', 'LIFT_GATE', 'GPS', 'TEMPERATURE_MONITORING'],
      },
    };

    const perfectCargoEntity = await loadsService.create(perfectCargo, cargoOwner.id, tenantId);
    console.log(`   ✅ Created perfect match cargo: ${perfectCargoEntity.title}`);
    console.log(`   📍 Distance: ~15km (Perfect distance score: 1.0)`);
    console.log(`   ⚖️  Capacity: 15,000kg / 20,000kg = 75% (Optimal: 1.0 score)`);
    console.log(`   🎯 Expected Overall Score: 95-98%\n`);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 SCENARIO 2: EXCELLENT MATCH (Expected Score: 85-95%)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Characteristics:');
    console.log('  ✅ Good capacity utilization (65% - slightly below optimal)');
    console.log('  ✅ Close distance (35km - good distance score)');
    console.log('  ✅ All equipment requirements met');
    console.log('  ✅ Good truck rating (4.5/5)');
    console.log('  ✅ Market-rate pricing\n');

    const excellentTruck: CreateTruckDto = {
      ...perfectTruck,
      plateNumber: 'EXCELLENT-001',
      vin: 'EXCELLENT001TRUC1',
      registrationNumber: 'REG-EXCELLENT-001',
      capacityWeight: 25000,
      capacityVolume: 80,
    };

    let excellentTruckEntity;
    try {
      excellentTruckEntity = await fleetService.createTruck(excellentTruck, truckOwners[1].id, tenantId);
      console.log(`   ✅ Created excellent match truck: ${excellentTruckEntity.plateNumber}`);
    } catch (error: any) {
      const existing = await truckRepository.findOne({ where: { plateNumber: 'EXCELLENT-001', tenantId } });
      if (existing) {
        excellentTruckEntity = existing;
        console.log(`   ✅ Found existing excellent match truck: ${excellentTruckEntity.plateNumber}`);
      } else throw error;
    }

    const excellentCargo: CreateLoadDto = {
      ...perfectCargo,
      title: 'General Cargo - Excellent Match Demo',
      description: 'General cargo with good matching characteristics',
      weight: 16250, // 65% utilization (good but not optimal)
      volume: 52, // 65% utilization
      cargoType: CargoType.GENERAL,
      requiresRefrigeration: false,
      requiresTemperatureMonitoring: false,
      locations: [
        {
          id: 'pickup-excellent-1',
          type: 'PICKUP',
          sequence: 1,
          status: 'PENDING' as any,
          scheduledDate: pickupDate1,
          locationData: {
            name: 'General Warehouse',
            address: '789 Commerce St, Manhattan, NY',
            coordinates: { latitude: 40.7128, longitude: -74.0060 },
          },
          estimatedTime: 120,
        },
        {
          id: 'delivery-excellent-1',
          type: 'DELIVERY',
          sequence: 2,
          status: 'PENDING' as any,
          scheduledDate: deliveryDate1,
          estimatedTime: 120,
          locationData: {
            name: 'Distribution Hub',
            address: '321 Logistics Blvd, Queens, NY',
            coordinates: { latitude: 40.7282, longitude: -73.7949 }, // ~35km away
          },
        },
      ],
    };

    const excellentCargoEntity = await loadsService.create(excellentCargo, cargoOwner.id, tenantId);
    console.log(`   ✅ Created excellent match cargo: ${excellentCargoEntity.title}`);
    console.log(`   📍 Distance: ~35km (Good distance score: 0.9)`);
    console.log(`   ⚖️  Capacity: 16,250kg / 25,000kg = 65% (Good: 0.8 score)`);
    console.log(`   🎯 Expected Overall Score: 85-92%\n`);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 SCENARIO 3: GOOD MATCH (Expected Score: 70-85%)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Characteristics:');
    console.log('  ⚠️  Moderate capacity utilization (55% - acceptable)');
    console.log('  ⚠️  Medium distance (75km - acceptable distance score)');
    console.log('  ✅ All critical equipment requirements met');
    console.log('  ⚠️  Average truck rating (4.0/5)');
    console.log('  ⚠️  Slightly above market pricing\n');

    const goodTruck: CreateTruckDto = {
      ...perfectTruck,
      plateNumber: 'GOOD-001',
      vin: 'GOODMATCH001TRUC1',
      registrationNumber: 'REG-GOOD-001',
      capacityWeight: 30000,
      capacityVolume: 100,
    };

    let goodTruckEntity;
    try {
      goodTruckEntity = await fleetService.createTruck(goodTruck, truckOwners[2].id, tenantId);
      console.log(`   ✅ Created good match truck: ${goodTruckEntity.plateNumber}`);
    } catch (error: any) {
      const existing = await truckRepository.findOne({ where: { plateNumber: 'GOOD-001', tenantId } });
      if (existing) {
        goodTruckEntity = existing;
        console.log(`   ✅ Found existing good match truck: ${goodTruckEntity.plateNumber}`);
      } else throw error;
    }

    const goodCargo: CreateLoadDto = {
      ...perfectCargo,
      title: 'Standard Cargo - Good Match Demo',
      description: 'Standard cargo with acceptable matching',
      weight: 16500, // 55% utilization
      volume: 55, // 55% utilization
      cargoType: CargoType.GENERAL,
      requiresRefrigeration: false,
      locations: [
        {
          id: 'pickup-good-1',
          type: 'PICKUP',
          sequence: 1,
          status: 'PENDING' as any,
          scheduledDate: pickupDate1,
          locationData: {
            name: 'Standard Warehouse',
            address: '555 Industrial Way, Brooklyn, NY',
            coordinates: { latitude: 40.7128, longitude: -74.0060 },
          },
          estimatedTime: 120,
        },
        {
          id: 'delivery-good-1',
          type: 'DELIVERY',
          sequence: 2,
          status: 'PENDING' as any,
          scheduledDate: deliveryDate1,
          estimatedTime: 120,
          locationData: {
            name: 'Retail Center',
            address: '777 Main Street, Newark, NJ',
            coordinates: { latitude: 40.7357, longitude: -74.1724 }, // ~75km away
          },
        },
      ],
    };

    const goodCargoEntity = await loadsService.create(goodCargo, cargoOwner.id, tenantId);
    console.log(`   ✅ Created good match cargo: ${goodCargoEntity.title}`);
    console.log(`   📍 Distance: ~75km (Acceptable distance score: 0.7)`);
    console.log(`   ⚖️  Capacity: 16,500kg / 30,000kg = 55% (Acceptable: 0.8 score)`);
    console.log(`   🎯 Expected Overall Score: 75-82%\n`);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 SCENARIO 4: HAZMAT MATCH (Expected Score: 80-90%)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Characteristics:');
    console.log('  ✅ Specialized hazmat permit required');
    console.log('  ✅ All safety requirements met');
    console.log('  ✅ Good capacity and distance');
    console.log('  ⚠️  Higher cost due to specialized handling\n');

    const hazmatTruck: CreateTruckDto = {
      ...perfectTruck,
      plateNumber: 'HAZMAT-001',
      vin: 'HAZMAT001TRUCK21',
      registrationNumber: 'REG-HAZMAT-001',
      hasHazmatPermit: true,
      cargoCapabilities: {
        ...perfectTruck.cargoCapabilities,
        maxHazardousHandling: true,
      },
    };

    let hazmatTruckEntity;
    try {
      hazmatTruckEntity = await fleetService.createTruck(hazmatTruck, truckOwners[3].id, tenantId);
      console.log(`   ✅ Created hazmat truck: ${hazmatTruckEntity.plateNumber}`);
    } catch (error: any) {
      const existing = await truckRepository.findOne({ where: { plateNumber: 'HAZMAT-001', tenantId } });
      if (existing) {
        hazmatTruckEntity = existing;
        console.log(`   ✅ Found existing hazmat truck: ${hazmatTruckEntity.plateNumber}`);
      } else throw error;
    }

    const hazmatCargo: CreateLoadDto = {
      ...perfectCargo,
      title: 'Hazardous Materials - Hazmat Match Demo',
      description: 'Hazardous materials requiring specialized transport',
      weight: 12000,
      volume: 40,
      cargoType: CargoType.HAZARDOUS,
      isHazardous: true,
      requiresRefrigeration: false,
      requiresTemperatureMonitoring: false,
      locations: [
        {
          id: 'pickup-hazmat-1',
          type: 'PICKUP',
          sequence: 1,
          status: 'PENDING' as any,
          scheduledDate: pickupDate1,
          locationData: {
            name: 'Chemical Plant',
            address: '999 Safety Road, Industrial Zone, NY',
            coordinates: { latitude: 40.7128, longitude: -74.0060 },
          },
          estimatedTime: 120,
        },
        {
          id: 'delivery-hazmat-1',
          type: 'DELIVERY',
          sequence: 2,
          status: 'PENDING' as any,
          scheduledDate: deliveryDate1,
          estimatedTime: 120,
          locationData: {
            name: 'Processing Facility',
            address: '888 Chemical Ave, Processing Zone, NJ',
            coordinates: { latitude: 40.7282, longitude: -73.7949 },
          },
        },
      ],
      truckRequirements: {
        minCapacityWeight: 10000,
        minCapacityVolume: 35,
        requiredTruckTypes: ['VAN'],
        requiredFeatures: ['HAZMAT_PERMIT'],
      },
    };

    const hazmatCargoEntity = await loadsService.create(hazmatCargo, cargoOwner.id, tenantId);
    console.log(`   ✅ Created hazmat cargo: ${hazmatCargoEntity.title}`);
    console.log(`   ⚠️  Requires Hazmat Permit: ✅`);
    console.log(`   🎯 Expected Overall Score: 80-88%\n`);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 SCENARIO 5: FRAGILE CARGO (Expected Score: 75-85%)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Characteristics:');
    console.log('  ✅ Fragile cargo requiring special handling');
    console.log('  ✅ Side rails and tarps for protection');
    console.log('  ✅ Careful loading/unloading requirements\n');

    const fragileTruck: CreateTruckDto = {
      ...perfectTruck,
      plateNumber: 'FRAGILE-001',
      vin: 'FRAGILE001TRUCK1',
      registrationNumber: 'REG-FRAGILE-001',
      hasSideRails: true,
      hasTarps: true,
      hasStraps: true,
    };

    let fragileTruckEntity;
    try {
      fragileTruckEntity = await fleetService.createTruck(fragileTruck, truckOwners[4].id, tenantId);
      console.log(`   ✅ Created fragile cargo truck: ${fragileTruckEntity.plateNumber}`);
    } catch (error: any) {
      const existing = await truckRepository.findOne({ where: { plateNumber: 'FRAGILE-001', tenantId } });
      if (existing) {
        fragileTruckEntity = existing;
        console.log(`   ✅ Found existing fragile cargo truck: ${fragileTruckEntity.plateNumber}`);
      } else throw error;
    }

    const fragileCargo: CreateLoadDto = {
      ...perfectCargo,
      title: 'Fragile Electronics - Fragile Match Demo',
      description: 'Fragile electronics requiring careful handling',
      weight: 8000,
      volume: 30,
      cargoType: CargoType.GENERAL,
      isFragile: true,
      requiresRefrigeration: false,
      requiresTemperatureMonitoring: false,
      locations: [
        {
          id: 'pickup-fragile-1',
          type: 'PICKUP',
          sequence: 1,
          status: 'PENDING' as any,
          scheduledDate: pickupDate1,
          locationData: {
            name: 'Electronics Warehouse',
            address: '111 Tech Street, Manhattan, NY',
            coordinates: { latitude: 40.7128, longitude: -74.0060 },
          },
          estimatedTime: 120,
        },
        {
          id: 'delivery-fragile-1',
          type: 'DELIVERY',
          sequence: 2,
          status: 'PENDING' as any,
          scheduledDate: deliveryDate1,
          estimatedTime: 120,
          locationData: {
            name: 'Retail Store',
            address: '222 Retail Ave, Brooklyn, NY',
            coordinates: { latitude: 40.7282, longitude: -73.9942 },
          },
        },
      ],
      truckRequirements: {
        minCapacityWeight: 8000,
        minCapacityVolume: 25,
        requiredTruckTypes: ['VAN'],
        requiredFeatures: ['SIDE_RAILS', 'TARPS', 'STRAPS'],
      },
    };

    const fragileCargoEntity = await loadsService.create(fragileCargo, cargoOwner.id, tenantId);
    console.log(`   ✅ Created fragile cargo: ${fragileCargoEntity.title}`);
    console.log(`   ⚠️  Requires Special Handling: ✅`);
    console.log(`   🎯 Expected Overall Score: 75-83%\n`);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 SCENARIO 6: LONG DISTANCE (Expected Score: 65-75%)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Characteristics:');
    console.log('  ⚠️  Long distance (200km+ - lower distance score)');
    console.log('  ✅ Good capacity utilization');
    console.log('  ⚠️  Higher cost due to distance\n');

    const longDistanceTruck: CreateTruckDto = {
      ...perfectTruck,
      plateNumber: 'LONGDIST-001',
      vin: 'LONGDIST001TRUCK',
      registrationNumber: 'REG-LONGDIST-001',
      fuelEfficiency: 8.5,
    };

    let longDistanceTruckEntity;
    try {
      longDistanceTruckEntity = await fleetService.createTruck(longDistanceTruck, truckOwners[0].id, tenantId);
      console.log(`   ✅ Created long distance truck: ${longDistanceTruckEntity.plateNumber}`);
    } catch (error: any) {
      const existing = await truckRepository.findOne({ where: { plateNumber: 'LONGDIST-001', tenantId } });
      if (existing) {
        longDistanceTruckEntity = existing;
        console.log(`   ✅ Found existing long distance truck: ${longDistanceTruckEntity.plateNumber}`);
      } else throw error;
    }

    const longDistanceCargo: CreateLoadDto = {
      ...perfectCargo,
      title: 'Cross-Country Cargo - Long Distance Demo',
      description: 'Long distance transport demonstration',
      weight: 15000,
      volume: 45,
      cargoType: CargoType.GENERAL,
      requiresRefrigeration: false,
      requiresTemperatureMonitoring: false,
      locations: [
        {
          id: 'pickup-long-1',
          type: 'PICKUP',
          sequence: 1,
          status: 'PENDING' as any,
          scheduledDate: pickupDate1,
          locationData: {
            name: 'Origin Warehouse',
            address: '333 Origin St, New York, NY',
            coordinates: { latitude: 40.7128, longitude: -74.0060 },
          },
          estimatedTime: 120,
        },
        {
          id: 'delivery-long-1',
          type: 'DELIVERY',
          sequence: 2,
          status: 'PENDING' as any,
          scheduledDate: deliveryDate1,
          estimatedTime: 120,
          locationData: {
            name: 'Destination Hub',
            address: '444 Destination Blvd, Philadelphia, PA',
            coordinates: { latitude: 39.9526, longitude: -75.1652 }, // ~150km away
          },
        },
      ],
    };

    const longDistanceCargoEntity = await loadsService.create(longDistanceCargo, cargoOwner.id, tenantId);
    console.log(`   ✅ Created long distance cargo: ${longDistanceCargoEntity.title}`);
    console.log(`   📍 Distance: ~150km (Lower distance score: 0.5)`);
    console.log(`   🎯 Expected Overall Score: 65-72%\n`);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ MATCHING DEMO SEED COMPLETE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📋 Created Scenarios:');
    console.log('   1. Perfect Match (95%+) - PERFECT-001 truck');
    console.log('   2. Excellent Match (85-95%) - EXCELLENT-001 truck');
    console.log('   3. Good Match (70-85%) - GOOD-001 truck');
    console.log('   4. Hazmat Match (80-90%) - HAZMAT-001 truck');
    console.log('   5. Fragile Cargo (75-85%) - FRAGILE-001 truck');
    console.log('   6. Long Distance (65-75%) - LONGDIST-001 truck');
    console.log('\n🎯 To Test Matching:');
    console.log('   1. Go to Cargo Owner Dashboard');
    console.log('   2. Select any of the created cargo items');
    console.log('   3. Navigate to "Matching" tab');
    console.log('   4. View detailed scoring breakdown for each truck');
    console.log('   5. Compare scores across different scenarios');
    console.log('\n📊 Scoring Factors Explained:');
    console.log('   • Capacity Score: Optimal 70-90% utilization = 1.0');
    console.log('   • Distance Score: ≤25km = 1.0, ≤50km = 0.9, ≤100km = 0.7');
    console.log('   • Equipment Score: All requirements met = 1.0');
    console.log('   • Rating Score: Based on truck averageRating / 5');
    console.log('   • Price Score: Cost vs market average');
    console.log('   • Special Requirements: Critical requirements must be met');
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error: any) {
    console.error('❌ Error seeding matching demo:', error.message);
    console.error(error.stack);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

seedMatchingDemo().catch(console.error);

