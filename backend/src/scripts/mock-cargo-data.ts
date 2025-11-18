import { DataSource } from 'typeorm';
import { User, UserRole, UserStatus } from '../entities/user.entity';
import { UserProfile } from '../entities/user-profile.entity';
import { Load, LoadStatus, CargoType } from '../entities/load.entity';
import { Location } from '../entities/location.entity';
import { Tenant, TenantStatus } from '../entities/tenant.entity';
import { Truck } from '../entities/truck.entity';
import { Driver } from '../entities/driver.entity';
import { Trip } from '../entities/trip.entity';
import { Payment } from '../entities/payment.entity';
import { Notification } from '../entities/notification.entity';
import { UserRating } from '../entities/user-rating.entity';
import { UserReward } from '../entities/user-reward.entity';
import { UserScore } from '../entities/user-score.entity';
import * as bcrypt from 'bcryptjs';

const dataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: '123',
  database: 'urutix',
  entities: [
    User,
    UserProfile,
    Load,
    Location,
    Tenant,
    Truck,
    Driver,
    Trip,
    Payment,
    Notification,
    UserRating,
    UserReward,
    UserScore,
  ],
  synchronize: true,
  logging: true,
});

async function createMockCargoData() {
  try {
    console.log('🔍 Creating mock cargo data...');

    await dataSource.initialize();
    console.log('✅ Database connected!');

    const userRepository = dataSource.getRepository(User);
    const userProfileRepository = dataSource.getRepository(UserProfile);
    const loadRepository = dataSource.getRepository(Load);
    const locationRepository = dataSource.getRepository(Location);
    const tenantRepository = dataSource.getRepository(Tenant);

    // Create tenant if it doesn't exist
    let tenant = await tenantRepository.findOne({
      where: { id: '00000000-0000-0000-0000-000000000001' },
    });

    if (!tenant) {
      console.log('🏢 Creating tenant...');
      tenant = new Tenant();
      tenant.id = '00000000-0000-0000-0000-000000000001';
      tenant.name = 'Default Tenant';
      tenant.domain = 'default.com';
      tenant.status = TenantStatus.ACTIVE;

      tenant = await tenantRepository.save(tenant);
      console.log('✅ Tenant created!');
    } else {
      console.log('✅ Tenant already exists!');
    }

    // Find or create test user
    let testUser = await userRepository.findOne({
      where: { email: 'test@example.com' },
    });

    if (!testUser) {
      console.log('👤 Creating test user...');

      const hashedPassword = await bcrypt.hash('test123', 10);

      testUser = new User();
      testUser.email = 'test@example.com';
      testUser.passwordHash = hashedPassword;
      testUser.tenantId = '00000000-0000-0000-0000-000000000001';
      testUser.role = UserRole.CARGO_OWNER;
      testUser.status = UserStatus.ACTIVE;

      testUser = await userRepository.save(testUser);
      console.log('✅ Test user created:', testUser.id);

      // Create profile
      const profile = new UserProfile();
      profile.userId = testUser.id;
      profile.tenantId = testUser.tenantId;
      profile.firstName = 'Test';
      profile.lastName = 'User';
      profile.companyName = 'Test Company';

      await userProfileRepository.save(profile);
      console.log('✅ Profile created!');
    } else {
      console.log('✅ Test user already exists!');
    }

    // Create mock locations
    const locations = [
      {
        name: 'Los Angeles Warehouse',
        address: '123 Main St, Los Angeles, CA',
        city: 'Los Angeles',
        state: 'CA',
        country: 'USA',
        postalCode: '90210',
        latitude: 34.0522,
        longitude: -118.2437,
        locationType: 'WAREHOUSE',
        tenantId: testUser.tenantId,
      },
      {
        name: 'New York Port',
        address: '456 Harbor Ave, New York, NY',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        postalCode: '10001',
        latitude: 40.7128,
        longitude: -74.006,
        locationType: 'PORT',
        tenantId: testUser.tenantId,
      },
      {
        name: 'Chicago Distribution Center',
        address: '789 Industrial Blvd, Chicago, IL',
        city: 'Chicago',
        state: 'IL',
        country: 'USA',
        postalCode: '60601',
        latitude: 41.8781,
        longitude: -87.6298,
        locationType: 'WAREHOUSE',
        tenantId: testUser.tenantId,
      },
      {
        name: 'Miami Port',
        address: '321 Ocean Dr, Miami, FL',
        city: 'Miami',
        state: 'FL',
        country: 'USA',
        postalCode: '33101',
        latitude: 25.7617,
        longitude: -80.1918,
        locationType: 'PORT',
        tenantId: testUser.tenantId,
      },
    ];

    const savedLocations = [];
    for (const locationData of locations) {
      const location = new Location();
      location.name = locationData.name;
      location.address = locationData.address;
      location.postalCode = locationData.postalCode;
      location.locationType = locationData.locationType;
      location.tenantId = locationData.tenantId;
      location.coordinates = {
        type: 'Point',
        coordinates: [locationData.longitude, locationData.latitude],
      };

      const savedLocation = await locationRepository.save(location);
      savedLocations.push(savedLocation);
      console.log(`✅ Location created: ${savedLocation.name}`);
    }

    // Create mock loads
    const loads = [
      {
        title: 'Electronics Shipment LA to NYC',
        description:
          'High-value electronics shipment from Los Angeles to New York',
        cargoType: CargoType.FRAGILE,
        weight: 5000,
        volume: 100,
        pickupDate: new Date('2024-02-15'),
        deliveryDate: new Date('2024-02-20'),
        status: LoadStatus.PUBLISHED,
        pickupLocationId: savedLocations[0].id,
        deliveryLocationId: savedLocations[1].id,
        cargoOwnerId: testUser.id,
        tenantId: testUser.tenantId,
        contactInfo: {
          name: 'John Doe',
          phone: '+1-555-0123',
          email: 'john@testcompany.com',
        },
        matchingCriteria: {
          maxPrice: 5000,
          preferredCarriers: ['FedEx', 'UPS'],
          specialRequirements: ['Temperature controlled', 'Insurance required'],
        },
      },
      {
        title: 'Automotive Parts Chicago to Miami',
        description:
          'Automotive parts shipment with special handling requirements',
        cargoType: CargoType.GENERAL,
        weight: 8000,
        volume: 150,
        pickupDate: new Date('2024-02-18'),
        deliveryDate: new Date('2024-02-25'),
        status: LoadStatus.DRAFT,
        pickupLocationId: savedLocations[2].id,
        deliveryLocationId: savedLocations[3].id,
        cargoOwnerId: testUser.id,
        tenantId: testUser.tenantId,
        contactInfo: {
          name: 'Jane Smith',
          phone: '+1-555-0456',
          email: 'jane@testcompany.com',
        },
        matchingCriteria: {
          maxPrice: 7500,
          preferredCarriers: ['DHL'],
          specialRequirements: ['Fragile handling', 'Express delivery'],
        },
      },
      {
        title: 'Textiles Miami to LA',
        description: 'Bulk textiles shipment for manufacturing',
        cargoType: CargoType.GENERAL,
        weight: 12000,
        volume: 200,
        pickupDate: new Date('2024-02-22'),
        deliveryDate: new Date('2024-02-28'),
        status: LoadStatus.PUBLISHED,
        pickupLocationId: savedLocations[3].id,
        deliveryLocationId: savedLocations[0].id,
        cargoOwnerId: testUser.id,
        tenantId: testUser.tenantId,
        contactInfo: {
          name: 'Mike Johnson',
          phone: '+1-555-0789',
          email: 'mike@testcompany.com',
        },
        matchingCriteria: {
          maxPrice: 6000,
          preferredCarriers: ['USPS'],
          specialRequirements: ['Standard delivery'],
        },
      },
    ];

    for (const loadData of loads) {
      const load = new Load();
      load.title = loadData.title;
      load.description = loadData.description;
      load.cargoType = loadData.cargoType;
      load.weight = loadData.weight;
      load.volume = loadData.volume;
      load.pickupDate = loadData.pickupDate;
      load.deliveryDate = loadData.deliveryDate;
      load.status = loadData.status;
      // Note: pickupLocationId and deliveryLocationId are replaced by locations array
      // load.locations = loadData.locations || [];
      load.cargoOwnerId = loadData.cargoOwnerId;
      load.tenantId = loadData.tenantId;
      load.contactInfo = loadData.contactInfo;
      load.matchingCriteria = loadData.matchingCriteria;
      load.loadValue = 50000; // Required field
      load.offeredPrice = 5000; // Optional but good to have
      load.currencyCode = 'USD';
      load.isFragile = loadData.cargoType === CargoType.FRAGILE;
      load.isHazardous = false;
      load.requiresRefrigeration = false;

      const savedLoad = await loadRepository.save(load);
      console.log(`✅ Load created: ${savedLoad.title}`);
    }

    await dataSource.destroy();
    console.log('🎉 Mock cargo data created successfully!');
    console.log('📊 Created:');
    console.log('  - 1 test user (test@example.com / test123)');
    console.log('  - 4 locations');
    console.log('  - 3 cargo loads');
  } catch (error) {
    console.error('❌ Failed to create mock cargo data:', error);
    process.exit(1);
  }
}

createMockCargoData();
