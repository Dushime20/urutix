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
 * Comprehensive Matching Algorithms Test Seeds
 * 
 * This seed file creates test data to validate all matching algorithms:
 * - WEIGHTED_SCORE (default)
 * - HUNGARIAN (optimal assignment)
 * - GENETIC (evolutionary optimization)
 * - TOPSIS (multi-criteria decision making)
 * - HYBRID (ensemble approach)
 * 
 * Test Scenarios:
 * 1. Multiple trucks for single cargo (tests ranking)
 * 2. Multiple cargos for single truck (tests Hungarian algorithm)
 * 3. Complex multi-cargo multi-truck scenario (tests Genetic & TOPSIS)
 * 4. Edge cases (capacity limits, distance extremes, special requirements)
 */

async function seedMatchingAlgorithmsTest() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    console.log('🌱 Starting Matching Algorithms Test Seeds...\n');

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

    // Create multiple truck owners
    const truckOwners = [];
    for (let i = 1; i <= 10; i++) {
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
      } else {
        console.log(`   ✅ Found truck owner ${i}: truck.owner${i}@test.com`);
      }
      truckOwners.push(owner);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 SCENARIO 1: WEIGHTED_SCORE Algorithm Test');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Creating 1 cargo with 5 trucks of varying scores for ranking test...\n');

    // Create 5 trucks with different characteristics for ranking
    const weightedScoreTrucks = [];
    const truckConfigs = [
      { name: 'WEIGHTED-001', capacity: 20000, distance: 15, rating: 4.8, price: 4000, features: 'all' },
      { name: 'WEIGHTED-002', capacity: 25000, distance: 35, rating: 4.5, price: 4200, features: 'most' },
      { name: 'WEIGHTED-003', capacity: 30000, distance: 75, rating: 4.0, price: 4500, features: 'basic' },
      { name: 'WEIGHTED-004', capacity: 18000, distance: 20, rating: 4.6, price: 3800, features: 'all' },
      { name: 'WEIGHTED-005', capacity: 22000, distance: 50, rating: 4.3, price: 4100, features: 'most' },
    ];

    for (let i = 0; i < truckConfigs.length; i++) {
      const config = truckConfigs[i];
      const truck: CreateTruckDto = {
        plateNumber: config.name,
        vin: `${config.name}TRUCK${i + 1}`.substring(0, 17),
        registrationNumber: `REG-${config.name}`,
        make: 'Freightliner',
        model: 'Cascadia',
        year: 2022 + i,
        color: 'White',
        fuelType: FuelType.DIESEL,
        insurancePolicy: `INS-${config.name}`,
        capacityWeight: config.capacity,
        capacityVolume: config.capacity / 250, // Rough conversion
        maxLength: 13.6,
        maxWidth: 2.5,
        maxHeight: 3.8,
        truckType: TruckType.VAN,
        mileage: 30000 + (i * 10000),
        fuelEfficiency: 9.0 - (i * 0.1),
        hasRefrigeration: config.features === 'all' || config.features === 'most',
        hasLiftGate: true,
        hasGps: true,
        hasHazmatPermit: config.features === 'all',
        hasSideRails: true,
        hasTarps: true,
        hasStraps: true,
        hasTailLift: config.features === 'all' || config.features === 'most',
        status: VehicleStatus.AVAILABLE,
        isActive: true,
        cargoCapabilities: {
          supportedCargoTypes: ['GENERAL', 'REFRIGERATED', 'FRAGILE'],
          temperatureRange: config.features === 'all' ? { min: 2, max: 8 } : undefined,
        },
        securityFeatures: {
          hasGps: true,
          hasTracking: config.features === 'all',
          hasTemperatureAlerts: config.features === 'all',
          hasCargoMonitoring: config.features === 'all',
        },
      };

      let truckEntity;
      try {
        truckEntity = await fleetService.createTruck(truck, truckOwners[i].id, tenantId);
        console.log(`   ✅ Created truck ${i + 1}: ${truckEntity.plateNumber} (Score: ${config.rating}/5)`);
        weightedScoreTrucks.push(truckEntity);
      } catch (error: any) {
        const existing = await truckRepository.findOne({ where: { plateNumber: config.name, tenantId } });
        if (existing) {
          truckEntity = existing;
          console.log(`   ✅ Found existing truck: ${existing.plateNumber}`);
          weightedScoreTrucks.push(truckEntity);
        } else {
          console.error(`   ❌ Failed to create truck ${config.name}:`, error.message);
        }
      }
    }

    // Create cargo for weighted score test
    const pickupDate1 = new Date();
    pickupDate1.setDate(pickupDate1.getDate() + 1);
    pickupDate1.setHours(8, 0, 0, 0);
    const deliveryDate1 = new Date();
    deliveryDate1.setDate(deliveryDate1.getDate() + 2);
    deliveryDate1.setHours(18, 0, 0, 0);

    const weightedScoreCargo: CreateLoadDto = {
      title: 'Weighted Score Algorithm Test Cargo',
      description: 'Test cargo for WEIGHTED_SCORE algorithm - should rank 5 trucks by score',
      weight: 15000,
      volume: 45,
      cargoType: CargoType.REFRIGERATED,
      loadType: LoadType.FTL,
      equipmentType: EquipmentType.DRY_VAN,
      visibility: Visibility.PUBLIC,
      unitsRequired: 1,
      pickupDate: pickupDate1,
      deliveryDate: deliveryDate1,
      loadValue: 75000,
      offeredPrice: 4000,
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
          id: 'pickup-weighted-1',
          type: 'PICKUP',
          sequence: 1,
          status: 'PENDING' as any,
          scheduledDate: pickupDate1,
          locationData: {
            name: 'Test Warehouse A',
            address: '123 Test St, Manhattan, NY',
            coordinates: { latitude: 40.7128, longitude: -74.0060 },
          },
          estimatedTime: 120,
        },
        {
          id: 'delivery-weighted-1',
          type: 'DELIVERY',
          sequence: 2,
          status: 'PENDING' as any,
          scheduledDate: deliveryDate1,
          locationData: {
            name: 'Test Distribution B',
            address: '456 Test Ave, Brooklyn, NY',
            coordinates: { latitude: 40.7282, longitude: -73.9942 },
          },
          estimatedTime: 120,
        },
      ],
      truckRequirements: {
        minCapacityWeight: 15000,
        minCapacityVolume: 40,
        requiredTruckTypes: ['VAN'],
        requiredFeatures: ['REFRIGERATION', 'LIFT_GATE', 'GPS', 'TEMPERATURE_MONITORING'],
      },
    };

    const weightedScoreCargoEntity = await loadsService.create(weightedScoreCargo, cargoOwner.id, tenantId);
    console.log(`   ✅ Created test cargo: ${weightedScoreCargoEntity.title} (ID: ${weightedScoreCargoEntity.id})`);
    console.log(`   🎯 Expected: 5 trucks ranked by overall score\n`);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 SCENARIO 2: HUNGARIAN Algorithm Test');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Creating 3 cargos and 3 trucks for optimal assignment test...\n');

    // Create 3 trucks for Hungarian algorithm
    const hungarianTrucks = [];
    for (let i = 0; i < 3; i++) {
      const truck: CreateTruckDto = {
        plateNumber: `HUNGARIAN-T${i + 1}`,
        vin: `HUNGARIAN${i + 1}TRUCK`.substring(0, 17),
        registrationNumber: `REG-HUNGARIAN-T${i + 1}`,
        make: 'Volvo',
        model: 'FH16',
        year: 2021 + i,
        color: 'Blue',
        fuelType: FuelType.DIESEL,
        insurancePolicy: `INS-HUNGARIAN-T${i + 1}`,
        capacityWeight: 20000 + (i * 5000),
        capacityVolume: 60 + (i * 10),
        maxLength: 13.6,
        maxWidth: 2.5,
        maxHeight: 3.8,
        truckType: TruckType.VAN,
        mileage: 40000 + (i * 5000),
        fuelEfficiency: 8.5,
        hasRefrigeration: i === 0,
        hasLiftGate: true,
        hasGps: true,
        hasHazmatPermit: i === 2,
        status: VehicleStatus.AVAILABLE,
        isActive: true,
      };

      let truckEntity;
      try {
        truckEntity = await fleetService.createTruck(truck, truckOwners[i + 5].id, tenantId);
        console.log(`   ✅ Created truck T${i + 1}: ${truckEntity.plateNumber}`);
        hungarianTrucks.push(truckEntity);
      } catch (error: any) {
        const existing = await truckRepository.findOne({ where: { plateNumber: truck.plateNumber, tenantId } });
        if (existing) {
          truckEntity = existing;
          hungarianTrucks.push(truckEntity);
        }
      }
    }

    // Create 3 cargos for Hungarian algorithm
    const hungarianCargos = [];
    for (let i = 0; i < 3; i++) {
      const pickupDate = new Date();
      pickupDate.setDate(pickupDate.getDate() + 2 + i);
      pickupDate.setHours(8, 0, 0, 0);
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + 3 + i);
      deliveryDate.setHours(18, 0, 0, 0);

      const cargo: CreateLoadDto = {
        title: `Hungarian Algorithm Test Cargo ${i + 1}`,
        description: `Test cargo ${i + 1} for HUNGARIAN algorithm optimal assignment`,
        weight: 15000 + (i * 2000),
        volume: 45 + (i * 5),
        cargoType: i === 0 ? CargoType.REFRIGERATED : i === 2 ? CargoType.HAZARDOUS : CargoType.GENERAL,
        loadType: LoadType.FTL,
        equipmentType: EquipmentType.DRY_VAN,
        visibility: Visibility.PUBLIC,
        unitsRequired: 1,
        pickupDate,
        deliveryDate,
        loadValue: 50000 + (i * 10000),
        offeredPrice: 3500 + (i * 200),
        currencyCode: 'USD',
        paymentTerms: PaymentTerms.NET_30,
        requiresRefrigeration: i === 0,
        isHazardous: i === 2,
        urgencyLevel: UrgencyLevel.NORMAL,
        locations: [
          {
            id: `pickup-hungarian-${i + 1}`,
            type: 'PICKUP',
            sequence: 1,
            status: 'PENDING' as any,
            scheduledDate: pickupDate,
            locationData: {
              name: `Warehouse ${i + 1}`,
              address: `${100 + i} Main St, City ${i + 1}`,
              coordinates: { latitude: 40.7128 + (i * 0.1), longitude: -74.0060 + (i * 0.1) },
            },
            estimatedTime: 120,
          },
          {
            id: `delivery-hungarian-${i + 1}`,
            type: 'DELIVERY',
            sequence: 2,
            status: 'PENDING' as any,
            scheduledDate: deliveryDate,
            locationData: {
              name: `Distribution ${i + 1}`,
              address: `${200 + i} Commerce Ave, City ${i + 1}`,
              coordinates: { latitude: 40.7282 + (i * 0.1), longitude: -73.9942 + (i * 0.1) },
            },
            estimatedTime: 120,
          },
        ],
      };

      const cargoEntity = await loadsService.create(cargo, cargoOwner.id, tenantId);
      console.log(`   ✅ Created cargo ${i + 1}: ${cargoEntity.title} (ID: ${cargoEntity.id})`);
      hungarianCargos.push(cargoEntity);
    }
    console.log(`   🎯 Expected: Optimal assignment minimizing total cost\n`);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 SCENARIO 3: GENETIC Algorithm Test');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Creating 5 cargos and 5 trucks for evolutionary optimization test...\n');

    // Create 5 trucks for Genetic algorithm
    const geneticTrucks = [];
    for (let i = 0; i < 5; i++) {
      const truck: CreateTruckDto = {
        plateNumber: `GENETIC-T${i + 1}`,
        vin: `GENETIC${i + 1}TRUCK`.substring(0, 17),
        registrationNumber: `REG-GENETIC-T${i + 1}`,
        make: 'Kenworth',
        model: 'T680',
        year: 2020 + i,
        color: 'Red',
        fuelType: FuelType.DIESEL,
        insurancePolicy: `INS-GENETIC-T${i + 1}`,
        capacityWeight: 18000 + (i * 3000),
        capacityVolume: 55 + (i * 8),
        maxLength: 13.6,
        maxWidth: 2.5,
        maxHeight: 3.8,
        truckType: TruckType.VAN,
        mileage: 50000 + (i * 8000),
        fuelEfficiency: 8.0 + (i * 0.2),
        hasRefrigeration: i % 2 === 0,
        hasLiftGate: true,
        hasGps: true,
        hasHazmatPermit: i === 4,
        status: VehicleStatus.AVAILABLE,
        isActive: true,
      };

      let truckEntity;
      try {
        truckEntity = await fleetService.createTruck(truck, truckOwners[i].id, tenantId);
        console.log(`   ✅ Created truck T${i + 1}: ${truckEntity.plateNumber}`);
        geneticTrucks.push(truckEntity);
      } catch (error: any) {
        const existing = await truckRepository.findOne({ where: { plateNumber: truck.plateNumber, tenantId } });
        if (existing) {
          truckEntity = existing;
          geneticTrucks.push(truckEntity);
        }
      }
    }

    // Create 5 cargos for Genetic algorithm
    for (let i = 0; i < 5; i++) {
      const pickupDate = new Date();
      pickupDate.setDate(pickupDate.getDate() + 3 + i);
      pickupDate.setHours(8, 0, 0, 0);
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + 4 + i);
      deliveryDate.setHours(18, 0, 0, 0);

      const cargo: CreateLoadDto = {
        title: `Genetic Algorithm Test Cargo ${i + 1}`,
        description: `Test cargo ${i + 1} for GENETIC algorithm evolutionary optimization`,
        weight: 12000 + (i * 1500),
        volume: 40 + (i * 4),
        cargoType: i === 0 ? CargoType.REFRIGERATED : i === 4 ? CargoType.HAZARDOUS : CargoType.GENERAL,
        loadType: LoadType.FTL,
        equipmentType: EquipmentType.DRY_VAN,
        visibility: Visibility.PUBLIC,
        unitsRequired: 1,
        pickupDate,
        deliveryDate,
        loadValue: 40000 + (i * 8000),
        offeredPrice: 3000 + (i * 300),
        currencyCode: 'USD',
        paymentTerms: PaymentTerms.NET_30,
        requiresRefrigeration: i === 0,
        isHazardous: i === 4,
        urgencyLevel: UrgencyLevel.NORMAL,
        locations: [
          {
            id: `pickup-genetic-${i + 1}`,
            type: 'PICKUP',
            sequence: 1,
            status: 'PENDING' as any,
            scheduledDate: pickupDate,
            locationData: {
              name: `Origin ${i + 1}`,
              address: `${300 + i} Origin St, Location ${i + 1}`,
              coordinates: { latitude: 40.7128 + (i * 0.15), longitude: -74.0060 + (i * 0.15) },
            },
            estimatedTime: 120,
          },
          {
            id: `delivery-genetic-${i + 1}`,
            type: 'DELIVERY',
            sequence: 2,
            status: 'PENDING' as any,
            scheduledDate: deliveryDate,
            locationData: {
              name: `Destination ${i + 1}`,
              address: `${400 + i} Dest Ave, Location ${i + 1}`,
              coordinates: { latitude: 40.7282 + (i * 0.15), longitude: -73.9942 + (i * 0.15) },
            },
            estimatedTime: 120,
          },
        ],
      };

      const cargoEntity = await loadsService.create(cargo, cargoOwner.id, tenantId);
      console.log(`   ✅ Created cargo ${i + 1}: ${cargoEntity.title} (ID: ${cargoEntity.id})`);
    }
    console.log(`   🎯 Expected: Evolutionary optimization finding best combinations\n`);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 SCENARIO 4: TOPSIS Algorithm Test');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Creating cargo with conflicting criteria for multi-criteria decision test...\n');

    // Create trucks with conflicting criteria (good in some, poor in others)
    const topsisTrucks = [];
    const topsisConfigs = [
      { name: 'TOPSIS-001', capacity: 20000, distance: 10, rating: 4.9, price: 5000 }, // Close, high rating, expensive
      { name: 'TOPSIS-002', capacity: 25000, distance: 100, rating: 4.0, price: 3000 }, // Far, low rating, cheap
      { name: 'TOPSIS-003', capacity: 18000, distance: 50, rating: 4.5, price: 4000 }, // Medium everything
      { name: 'TOPSIS-004', capacity: 22000, distance: 25, rating: 4.7, price: 4500 }, // Good balance
    ];

    for (let i = 0; i < topsisConfigs.length; i++) {
      const config = topsisConfigs[i];
      const truck: CreateTruckDto = {
        plateNumber: config.name,
        vin: `${config.name}TRUCK`.substring(0, 17),
        registrationNumber: `REG-${config.name}`,
        make: 'Peterbilt',
        model: '579',
        year: 2021 + i,
        color: 'Green',
        fuelType: FuelType.DIESEL,
        insurancePolicy: `INS-${config.name}`,
        capacityWeight: config.capacity,
        capacityVolume: config.capacity / 250,
        maxLength: 13.6,
        maxWidth: 2.5,
        maxHeight: 3.8,
        truckType: TruckType.VAN,
        mileage: 35000 + (i * 5000),
        fuelEfficiency: 8.5,
        hasRefrigeration: true,
        hasLiftGate: true,
        hasGps: true,
        status: VehicleStatus.AVAILABLE,
        isActive: true,
      };

      let truckEntity;
      try {
        truckEntity = await fleetService.createTruck(truck, truckOwners[i + 3].id, tenantId);
        console.log(`   ✅ Created truck ${i + 1}: ${truckEntity.plateNumber}`);
        topsisTrucks.push(truckEntity);
      } catch (error: any) {
        const existing = await truckRepository.findOne({ where: { plateNumber: config.name, tenantId } });
        if (existing) {
          truckEntity = existing;
          topsisTrucks.push(truckEntity);
        }
      }
    }

    // Create cargo for TOPSIS test
    const pickupDate4 = new Date();
    pickupDate4.setDate(pickupDate4.getDate() + 1);
    pickupDate4.setHours(8, 0, 0, 0);
    const deliveryDate4 = new Date();
    deliveryDate4.setDate(deliveryDate4.getDate() + 2);
    deliveryDate4.setHours(18, 0, 0, 0);

    const topsisCargo: CreateLoadDto = {
      title: 'TOPSIS Algorithm Test Cargo',
      description: 'Test cargo for TOPSIS algorithm - conflicting criteria (distance vs price vs rating)',
      weight: 15000,
      volume: 45,
      cargoType: CargoType.REFRIGERATED,
      loadType: LoadType.FTL,
      equipmentType: EquipmentType.DRY_VAN,
      visibility: Visibility.PUBLIC,
      unitsRequired: 1,
      pickupDate: pickupDate4,
      deliveryDate: deliveryDate4,
      loadValue: 60000,
      offeredPrice: 4000,
      currencyCode: 'USD',
      paymentTerms: PaymentTerms.NET_30,
      requiresRefrigeration: true,
      requiresForklift: true,
      requiresLoadingDock: true,
      requiresGpsMonitoring: true,
      urgencyLevel: UrgencyLevel.NORMAL,
      locations: [
        {
          id: 'pickup-topsis-1',
          type: 'PICKUP',
          sequence: 1,
          status: 'PENDING' as any,
          scheduledDate: pickupDate4,
          locationData: {
            name: 'TOPSIS Warehouse',
            address: '500 Test St, Manhattan, NY',
            coordinates: { latitude: 40.7128, longitude: -74.0060 },
          },
          estimatedTime: 120,
        },
        {
          id: 'delivery-topsis-1',
          type: 'DELIVERY',
          sequence: 2,
          status: 'PENDING' as any,
          scheduledDate: deliveryDate4,
          locationData: {
            name: 'TOPSIS Distribution',
            address: '600 Test Ave, Brooklyn, NY',
            coordinates: { latitude: 40.7282, longitude: -73.9942 },
          },
          estimatedTime: 120,
        },
      ],
    };

    const topsisCargoEntity = await loadsService.create(topsisCargo, cargoOwner.id, tenantId);
    console.log(`   ✅ Created test cargo: ${topsisCargoEntity.title} (ID: ${topsisCargoEntity.id})`);
    console.log(`   🎯 Expected: Multi-criteria decision based on ideal/negative-ideal solutions\n`);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 SCENARIO 5: HYBRID Algorithm Test');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Creating complex scenario for ensemble algorithm test...\n');

    // Create diverse trucks for hybrid test
    const hybridTrucks = [];
    for (let i = 0; i < 6; i++) {
      const truck: CreateTruckDto = {
        plateNumber: `HYBRID-T${i + 1}`,
        vin: `HYBRID${i + 1}TRUCK`.substring(0, 17),
        registrationNumber: `REG-HYBRID-T${i + 1}`,
        make: ['Freightliner', 'Volvo', 'Kenworth', 'Peterbilt', 'Mack', 'International'][i],
        model: ['Cascadia', 'FH16', 'T680', '579', 'Anthem', 'LT'][i],
        year: 2020 + (i % 3),
        color: ['White', 'Blue', 'Red', 'Green', 'Black', 'Silver'][i],
        fuelType: FuelType.DIESEL,
        insurancePolicy: `INS-HYBRID-T${i + 1}`,
        capacityWeight: 15000 + (i * 4000),
        capacityVolume: 50 + (i * 8),
        maxLength: 13.6,
        maxWidth: 2.5,
        maxHeight: 3.8,
        truckType: TruckType.VAN,
        mileage: 40000 + (i * 6000),
        fuelEfficiency: 8.0 + (i * 0.3),
        hasRefrigeration: i % 2 === 0,
        hasLiftGate: true,
        hasGps: true,
        hasHazmatPermit: i === 5,
        status: VehicleStatus.AVAILABLE,
        isActive: true,
      };

      let truckEntity;
      try {
        truckEntity = await fleetService.createTruck(truck, truckOwners[i % truckOwners.length].id, tenantId);
        console.log(`   ✅ Created truck T${i + 1}: ${truckEntity.plateNumber}`);
        hybridTrucks.push(truckEntity);
      } catch (error: any) {
        const existing = await truckRepository.findOne({ where: { plateNumber: truck.plateNumber, tenantId } });
        if (existing) {
          truckEntity = existing;
          hybridTrucks.push(truckEntity);
        }
      }
    }

    // Create cargo for hybrid test
    const pickupDate5 = new Date();
    pickupDate5.setDate(pickupDate5.getDate() + 1);
    pickupDate5.setHours(8, 0, 0, 0);
    const deliveryDate5 = new Date();
    deliveryDate5.setDate(deliveryDate5.getDate() + 2);
    deliveryDate5.setHours(18, 0, 0, 0);

    const hybridCargo: CreateLoadDto = {
      title: 'Hybrid Algorithm Test Cargo',
      description: 'Test cargo for HYBRID algorithm - ensemble approach combining multiple algorithms',
      weight: 18000,
      volume: 55,
      cargoType: CargoType.REFRIGERATED,
      loadType: LoadType.FTL,
      equipmentType: EquipmentType.DRY_VAN,
      visibility: Visibility.PUBLIC,
      unitsRequired: 1,
      pickupDate: pickupDate5,
      deliveryDate: deliveryDate5,
      loadValue: 80000,
      offeredPrice: 4500,
      currencyCode: 'USD',
      paymentTerms: PaymentTerms.NET_30,
      requiresRefrigeration: true,
      requiresForklift: true,
      requiresLoadingDock: true,
      requiresGpsMonitoring: true,
      requiresTemperatureMonitoring: true,
      urgencyLevel: UrgencyLevel.HIGH,
      locations: [
        {
          id: 'pickup-hybrid-1',
          type: 'PICKUP',
          sequence: 1,
          status: 'PENDING' as any,
          scheduledDate: pickupDate5,
          locationData: {
            name: 'Hybrid Warehouse',
            address: '700 Hybrid St, Manhattan, NY',
            coordinates: { latitude: 40.7128, longitude: -74.0060 },
          },
          estimatedTime: 120,
        },
        {
          id: 'delivery-hybrid-1',
          type: 'DELIVERY',
          sequence: 2,
          status: 'PENDING' as any,
          scheduledDate: deliveryDate5,
          locationData: {
            name: 'Hybrid Distribution',
            address: '800 Hybrid Ave, Brooklyn, NY',
            coordinates: { latitude: 40.7282, longitude: -73.9942 },
          },
          estimatedTime: 120,
        },
      ],
      truckRequirements: {
        minCapacityWeight: 18000,
        minCapacityVolume: 50,
        requiredTruckTypes: ['VAN'],
        requiredFeatures: ['REFRIGERATION', 'LIFT_GATE', 'GPS', 'TEMPERATURE_MONITORING'],
      },
    };

    const hybridCargoEntity = await loadsService.create(hybridCargo, cargoOwner.id, tenantId);
    console.log(`   ✅ Created test cargo: ${hybridCargoEntity.title} (ID: ${hybridCargoEntity.id})`);
    console.log(`   🎯 Expected: Ensemble results from multiple algorithms combined\n`);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ MATCHING ALGORITHMS TEST SEED COMPLETE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📋 Test Scenarios Created:');
    console.log('   1. WEIGHTED_SCORE: 1 cargo, 5 trucks (ranking test)');
    console.log('   2. HUNGARIAN: 3 cargos, 3 trucks (optimal assignment)');
    console.log('   3. GENETIC: 5 cargos, 5 trucks (evolutionary optimization)');
    console.log('   4. TOPSIS: 1 cargo, 4 trucks (multi-criteria decision)');
    console.log('   5. HYBRID: 1 cargo, 6 trucks (ensemble approach)');
    console.log('\n🎯 How to Test:');
    console.log('   1. Go to Cargo Owner Dashboard');
    console.log('   2. Select a test cargo from the list above');
    console.log('   3. Navigate to "Matching" tab');
    console.log('   4. Test different algorithms:');
    console.log('      - POST /matching/find-matches (WEIGHTED_SCORE)');
    console.log('      - POST /matching/find-matches/hungarian (HUNGARIAN)');
    console.log('      - POST /matching/find-matches/genetic (GENETIC)');
    console.log('      - POST /matching/find-matches/topsis (TOPSIS)');
    console.log('      - POST /matching/find-matches/hybrid (HYBRID)');
    console.log('   5. Compare results across different algorithms');
    console.log('   6. Review scoring breakdowns and match reasons');
    console.log('\n📊 Expected Results:');
    console.log('   • WEIGHTED_SCORE: Trucks ranked by weighted score');
    console.log('   • HUNGARIAN: Optimal cost-minimizing assignments');
    console.log('   • GENETIC: Best combinations through evolution');
    console.log('   • TOPSIS: Best compromise across conflicting criteria');
    console.log('   • HYBRID: Ensemble results with highest confidence');
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error: any) {
    console.error('❌ Error seeding matching algorithms test:', error.message);
    console.error(error.stack);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

seedMatchingAlgorithmsTest().catch(console.error);

