#!/usr/bin/env node

/**
 * 🚛 CARGO MANAGEMENT SYSTEM DATABASE SEEDER
 * 
 * This script populates the database with comprehensive mock data
 * for testing the cargo management system APIs and frontend functionality.
 */

const { Pool } = require('pg');
require('dotenv').config();
// import * as bcrypt from 'bcryptjs';
const bcrypt = require('bcryptjs');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'urutix_database',
  user: process.env.DB_USERNAME || 'dev',
  password: process.env.DB_PASSWORD || 'password',
};

async function seedCargoDatabase() {
  console.log('🚛 Starting Cargo Management System Database Seeding...\n');
  
  const pool = new Pool(dbConfig);
  
  try {
    // Test database connection
    console.log('📡 Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful!\n');
    
    // Get the default tenant
    console.log('🏢 Getting default tenant...');
    const tenantResult = await pool.query('SELECT id FROM tenants WHERE "isActive" = true LIMIT 1');
    if (tenantResult.rows.length === 0) {
      throw new Error('No active tenant found. Please ensure the default tenant exists.');
    }
    const tenantId = tenantResult.rows[0].id;
    console.log(`✅ Using tenant: ${tenantId}\n`);
    
    // Step 1: Create users (cargo owners, truck owners, drivers)
    console.log('👥 Creating users...');
    
    const users = [
      {
        email: 'cargo.owner@test.com',
        phone: '+1-555-0101',
        role: 'CARGO_OWNER',
        status: 'ACTIVE'
      },
      {
        email: 'truck.owner@test.com',
        phone: '+1-555-0102',
        role: 'TRUCK_OWNER',
        status: 'ACTIVE'
      },
      {
        email: 'driver@test.com',
        phone: '+1-555-0103',
        role: 'DRIVER',
        status: 'ACTIVE'
      },
      {
        email: 'admin@test.com',
        phone: '+1-555-0104',
        role: 'ADMIN',
        status: 'ACTIVE'
      }
    ];
    
    const createdUsers = [];
    for (const user of users) {
      const passwordHash = await bcrypt.hash('test123', 10);
      const result = await pool.query(`
        INSERT INTO users (id, "tenantId", email, phone, "passwordHash", role, status, "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), NOW())
        ON CONFLICT (email) DO NOTHING
        RETURNING id, email, role
      `, [tenantId, user.email, user.phone, passwordHash, user.role, user.status]);
      
      if (result.rows.length > 0) {
        createdUsers.push(result.rows[0]);
        console.log(`✅ Created user: ${user.email} (${user.role})`);
      } else {
        // Get existing user
        const existingUser = await pool.query(`
          SELECT id, email, role FROM users WHERE email = $1
        `, [user.email]);
        if (existingUser.rows.length > 0) {
          createdUsers.push(existingUser.rows[0]);
          console.log(`⚠️  User already exists: ${user.email}`);
        }
      }
    }
    console.log('');
    
    // Step 2: Create user profiles
    console.log('👤 Creating user profiles...');
    
    const userProfiles = [
      {
        userId: createdUsers.find(u => u.role === 'CARGO_OWNER')?.id,
        firstName: 'John',
        lastName: 'CargoOwner',
        companyName: 'QuickShip Logistics',
        address: '100 Logistics Way, Dallas, TX 75201',
        country: 'USA',
        postalCode: '75201',
        kycStatus: 'VERIFIED'
      },
      {
        userId: createdUsers.find(u => u.role === 'TRUCK_OWNER')?.id,
        firstName: 'Mike',
        lastName: 'TruckOwner',
        companyName: 'Swift Transport LLC',
        address: '200 Transport Ave, Atlanta, GA 30309',
        country: 'USA',
        postalCode: '30309',
        kycStatus: 'VERIFIED'
      },
      {
        userId: createdUsers.find(u => u.role === 'DRIVER')?.id,
        firstName: 'David',
        lastName: 'Driver',
        companyName: 'Professional Driving Services',
        address: '300 Driver Street, Chicago, IL 60601',
        country: 'USA',
        postalCode: '60601',
        kycStatus: 'VERIFIED'
      }
    ];
    
    for (const profile of userProfiles) {
      if (profile.userId) {
        await pool.query(`
          INSERT INTO user_profiles (id, "userId", "tenantId", "firstName", "lastName", "companyName", 
                                   address, "postalCode", "countryCode", "kycStatus", "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
          ON CONFLICT ("userId") DO NOTHING
        `, [profile.userId, tenantId, profile.firstName, profile.lastName, profile.companyName,
            profile.address, profile.postalCode, profile.country, profile.kycStatus]);
        console.log(`✅ Created profile for: ${profile.firstName} ${profile.lastName}`);
      }
    }
    console.log('');
    
    // Step 3: Create locations
    console.log('📍 Creating locations...');
    
    const locations = [
      {
        name: 'Dallas Warehouse',
        address: '100 Logistics Way, Dallas, TX 75201',
        city: 'Dallas',
        state: 'TX',
        country: 'USA',
        coordinates: 'POINT(-96.7970 32.7767)',
        locationType: 'WAREHOUSE'
      },
      {
        name: 'Atlanta Distribution Center',
        address: '200 Transport Ave, Atlanta, GA 30309',
        city: 'Atlanta',
        state: 'GA',
        country: 'USA',
        coordinates: 'POINT(-84.3880 33.7490)',
        locationType: 'DISTRIBUTION_CENTER'
      },
      {
        name: 'Chicago Freight Terminal',
        address: '300 Freight Terminal, Chicago, IL 60601',
        city: 'Chicago',
        state: 'IL',
        country: 'USA',
        coordinates: 'POINT(-87.6298 41.8781)',
        locationType: 'FREIGHT_TERMINAL'
      },
      {
        name: 'Los Angeles Port',
        address: '400 Port Way, Los Angeles, CA 90012',
        city: 'Los Angeles',
        state: 'CA',
        country: 'USA',
        coordinates: 'POINT(-118.2437 34.0522)',
        locationType: 'PORT'
      }
    ];
    
    const createdLocations = [];
    for (const location of locations) {
      const result = await pool.query(`
        INSERT INTO locations (id, "tenantId", name, address, city, state, country, coordinates, "locationType", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, ST_GeomFromText($7, 4326), $8, NOW(), NOW())
        RETURNING id, name
      `, [tenantId, location.name, location.address, location.city, location.state, 
          location.country, location.coordinates, location.locationType]);
      
      createdLocations.push(result.rows[0]);
      console.log(`✅ Created location: ${location.name}`);
    }
    console.log('');
    
    // Step 4: Create trucks
    console.log('🚛 Creating trucks...');
    
    const truckOwnerId = createdUsers.find(u => u.role === 'TRUCK_OWNER')?.id;
    if (truckOwnerId) {
      const trucks = [
        {
          plateNumber: 'TX-1234',
          vin: '1HGBH41JXMN109186',
          make: 'Freightliner',
          model: 'Cascadia',
          year: 2022,
          capacityWeight: 80000,
          capacityVolume: 3000,
          status: 'AVAILABLE'
        },
        {
          plateNumber: 'GA-5678',
          vin: '2FMDK48C67BA12345',
          make: 'Peterbilt',
          model: '579',
          year: 2021,
          capacityWeight: 80000,
          capacityVolume: 3200,
          status: 'AVAILABLE'
        }
      ];
      
      for (const truck of trucks) {
        await pool.query(`
          INSERT INTO trucks (id, "tenantId", "ownerId", "plateNumber", vin, make, model, year, 
                             "capacityWeight", "capacityVolume", status, "registrationNumber", 
                             "registrationExpiry", "insurancePolicy", "insuranceExpiry", "updatedAt")
          VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
          ON CONFLICT (vin) DO NOTHING
        `, [tenantId, truckOwnerId, truck.plateNumber, truck.vin, truck.make, truck.model, truck.year,
            truck.capacityWeight, truck.capacityVolume, truck.status, truck.plateNumber,
            '2025-12-31', truck.plateNumber, '2025-12-31']);
        console.log(`✅ Created truck: ${truck.plateNumber} (${truck.make} ${truck.model})`);
      }
    }
    console.log('');
    
    // Step 5: Create loads
    console.log('📦 Creating loads...');
    
    const cargoOwnerId = createdUsers.find(u => u.role === 'CARGO_OWNER')?.id;
    if (cargoOwnerId && createdLocations.length >= 2) {
      const loads = [
        {
          title: 'Electronics from Dallas to Atlanta',
          description: 'Sensitive electronics requiring careful handling',
          weight: 5000,
          volume: 200,
          cargoType: 'FRAGILE',
          loadValue: 50000,
          offeredPrice: 2500,
          urgencyLevel: 'HIGH'
        },
        {
          title: 'Furniture from Chicago to Los Angeles',
          description: 'Office furniture for new branch',
          weight: 8000,
          volume: 400,
          cargoType: 'GENERAL',
          loadValue: 15000,
          offeredPrice: 3500,
          urgencyLevel: 'NORMAL'
        }
      ];
      
      for (let i = 0; i < loads.length; i++) {
        const load = loads[i];
        const pickupLocationId = createdLocations[i % createdLocations.length].id;
        const deliveryLocationId = createdLocations[(i + 1) % createdLocations.length].id;
        
        await pool.query(`
          INSERT INTO loads (id, "tenantId", "cargoOwnerId", title, description, weight, volume, 
                            "cargoType", "loadValue", "offeredPrice", "urgencyLevel", status, 
                            locations, "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
        `, [tenantId, cargoOwnerId, load.title, load.description, load.weight, load.volume,
            load.cargoType, load.loadValue, load.offeredPrice, load.urgencyLevel, 'PUBLISHED',
            JSON.stringify([
              {
                id: require('crypto').randomUUID(),
                type: 'PICKUP',
                sequence: 1,
                locationData: {
                  name: createdLocations[i % createdLocations.length].name,
                  address: createdLocations[i % createdLocations.length].name
                },
                scheduledDate: new Date(Date.now() + 86400000).toISOString(),
                estimatedTime: 60,
                requirements: {},
                status: 'PENDING'
              },
              {
                id: require('crypto').randomUUID(),
                type: 'DELIVERY',
                sequence: 2,
                locationData: {
                  name: createdLocations[(i + 1) % createdLocations.length].name,
                  address: createdLocations[(i + 1) % createdLocations.length].name
                },
                scheduledDate: new Date(Date.now() + 172800000).toISOString(),
                estimatedTime: 60,
                requirements: {},
                status: 'PENDING'
              }
            ])]);
        console.log(`✅ Created load: ${load.title}`);
      }
    }
    console.log('');
    
    // Step 6: Create bids
    console.log('💰 Creating bids...');
    
    const loadsResult = await pool.query('SELECT id FROM loads LIMIT 2');
    const truckOwnerIdForBids = createdUsers.find(u => u.role === 'TRUCK_OWNER')?.id;
    
    if (loadsResult.rows.length > 0 && truckOwnerIdForBids) {
      for (const load of loadsResult.rows) {
        await pool.query(`
          INSERT INTO bids (id, "loadId", "truckOwnerId", "bidAmount", "bidCurrency", status, "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())
        `, [load.id, truckOwnerIdForBids, 2400, 'USD', 'PENDING']);
        console.log(`✅ Created bid for load: $2400`);
      }
    }
    console.log('');
    
    // Step 7: Create drivers
    console.log('🚗 Creating drivers...');
    
    const driverUserId = createdUsers.find(u => u.role === 'DRIVER')?.id;
    const truckOwnerIdForDriver = createdUsers.find(u => u.role === 'TRUCK_OWNER')?.id;
    
    if (driverUserId && truckOwnerIdForDriver) {
      const driverResult = await pool.query(`
        INSERT INTO drivers (id, "tenantId", "userId", "employerId", "employeeId", "firstName", "lastName", 
                            email, phone, "dateOfBirth", address, "emergencyContact", "licenseNumber", 
                            "licenseClasses", "licenseIssueDate", "licenseExpiry", "licenseState", 
                            "licenseCountry", endorsements, restrictions, "employmentType", "hireDate", 
                            status, "availabilityStatus", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, NOW(), NOW())
        ON CONFLICT ("licenseNumber") DO NOTHING
        RETURNING id, "firstName", "lastName"
      `, [tenantId, driverUserId, truckOwnerIdForDriver, 'EMP001', 'David', 'Driver', 
          'driver@test.com', '+1-555-0103', '1985-06-15', '300 Driver Street, Chicago, IL 60601',
          JSON.stringify({name: 'Emergency Contact', phone: '+1-555-9999'}), 'DL123456789',
          JSON.stringify(['CDL-A']), '2020-01-15', '2025-01-15', 'IL', 'USA',
          JSON.stringify([]), JSON.stringify([]), 'FULL_TIME', '2023-01-01', 'ACTIVE', 'AVAILABLE']);
      
      if (driverResult.rows.length > 0) {
        console.log(`✅ Created driver: ${driverResult.rows[0].firstName} ${driverResult.rows[0].lastName}`);
      } else {
        console.log(`⚠️  Driver already exists`);
      }
    }
    console.log('');
    
    // Step 8: Create trips
    console.log('🚚 Creating trips...');
    
    const driversResult = await pool.query('SELECT id FROM drivers LIMIT 1');
    const trucksResult = await pool.query('SELECT id FROM trucks LIMIT 1');
    
    if (loadsResult.rows.length > 0 && driversResult.rows.length > 0 && trucksResult.rows.length > 0) {
      for (let i = 0; i < Math.min(loadsResult.rows.length, trucksResult.rows.length); i++) {
        const load = loadsResult.rows[i];
        const truck = trucksResult.rows[i];
        const driver = driversResult.rows[0]; // Use the same driver for all trips
        
        await pool.query(`
          INSERT INTO trips (id, "tenantId", "loadId", "truckId", "driverId", "tripNumber", 
                            "plannedStartTime", "plannedEndTime", "agreedPrice", "currencyCode", 
                            status, "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        `, [tenantId, load.id, truck.id, driver.id, `TRIP-${Date.now()}-${i}`, 
            new Date(Date.now() + 86400000), new Date(Date.now() + 172800000), 
            2400, 'USD', 'PLANNED']);
        console.log(`✅ Created trip: TRIP-${Date.now()}-${i}`);
      }
    }
    console.log('');
    
    // Verification
    console.log('🔍 Verifying seeded data...\n');
    
    const verificationQueries = [
      { name: 'Users', query: 'SELECT COUNT(*) as count FROM users' },
      { name: 'User Profiles', query: 'SELECT COUNT(*) as count FROM user_profiles' },
      { name: 'Locations', query: 'SELECT COUNT(*) as count FROM locations' },
      { name: 'Trucks', query: 'SELECT COUNT(*) as count FROM trucks' },
      { name: 'Loads', query: 'SELECT COUNT(*) as count FROM loads' },
      { name: 'Bids', query: 'SELECT COUNT(*) as count FROM bids' },
      { name: 'Trips', query: 'SELECT COUNT(*) as count FROM trips' },
    ];
    
    console.log('📋 Data Verification Results:');
    console.log('┌─────────────────────┬───────┐');
    console.log('│ Table               │ Count │');
    console.log('├─────────────────────┼───────┤');
    
    for (const { name, query } of verificationQueries) {
      const result = await pool.query(query);
      const count = result.rows[0].count;
      console.log(`│ ${name.padEnd(19)} │ ${count.toString().padStart(5)} │`);
    }
    
    console.log('└─────────────────────┴───────┘\n');
    
    console.log('🎉 Cargo Management System seeding completed successfully!');
    console.log('\n📝 Test Credentials:');
    console.log('   Cargo Owner: cargo.owner@test.com');
    console.log('   Truck Owner: truck.owner@test.com');
    console.log('   Driver: driver@test.com');
    console.log('   Admin: admin@test.com');
    console.log('   Password: (hashed in database)\n');
    
  } catch (error) {
    console.error('❌ Error during seeding:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the seeder
if (require.main === module) {
  seedCargoDatabase()
    .then(() => {
      console.log('✅ Seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedCargoDatabase };
