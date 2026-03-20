#!/usr/bin/env node

/**
 * 🚀 COMPLETE SYSTEM DATABASE SEEDER
 * 
 * This script populates the database with comprehensive data for both
 * cargo owners and truck owners, including:
 * - Users (cargo owners, truck owners, drivers)
 * - Cargo shipments (PUBLISHED for auctions)
 * - Trucks and drivers
 * - Active auctions with bids
 * - Trips (PLANNED and COMPLETED)
 * - Payments
 * - Routes
 * 
 * Run with: node src/database/seeds/seed-complete-system.js
 */

const { Pool } = require('pg');
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'urutix_database',
  user: process.env.DB_USERNAME || 'dev',
  password: process.env.DB_PASSWORD || 'password',
};

const pool = new Pool(dbConfig);

// Helper function to generate UUID
function generateUUID() {
  return uuidv4();
}

// Helper function to get or create tenant
async function getOrCreateTenant() {
  const result = await pool.query('SELECT id FROM tenants WHERE "isActive" = true LIMIT 1');
  if (result.rows.length > 0) {
    return result.rows[0].id;
  }
  
  // Create default tenant if none exists
  const tenantId = generateUUID();
  await pool.query(`
    INSERT INTO tenants (
      id, name, subdomain, type, status, "isActive", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
  `, [
    tenantId,
    'Uruti-X Default',
    'default',
    'ENTERPRISE',
    'ACTIVE',
    true
  ]);
  return tenantId;
}

// Helper function to get or create user
async function getOrCreateUser(email, phone, role, tenantId, firstName, lastName, companyName) {
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  
  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }
  
  const userId = generateUUID();
  const passwordHash = await bcrypt.hash('test123', 10);
  
  await pool.query(`
    INSERT INTO users (
      id, email, phone, "passwordHash", role, status, "tenantId", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
  `, [userId, email, phone, passwordHash, role, 'ACTIVE', tenantId]);
  
  // Create profile
  const profileId = generateUUID();
  await pool.query(`
    INSERT INTO user_profiles (
      id, "userId", "tenantId", "firstName", "lastName", "companyName", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
  `, [profileId, userId, tenantId, firstName, lastName, companyName]);
  
  return userId;
}

// Helper function to create location
async function createLocation(tenantId, name, address, city, state, country, lat, lng) {
  const locationId = generateUUID();
  await pool.query(`
    INSERT INTO locations (
      id, "tenantId", name, address, city, state, country, coordinates, "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
  `, [
    locationId,
    tenantId,
    name,
    address,
    city,
    state,
    country,
    JSON.stringify({ latitude: lat, longitude: lng })
  ]);
  return locationId;
}

async function seedCompleteSystem() {
  console.log('🚀 Starting Complete System Database Seeding...\n');
  
  try {
    // Test database connection
    console.log('📡 Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful!\n');
    
    // Get or create tenant
    console.log('🏢 Getting or creating tenant...');
    const tenantId = await getOrCreateTenant();
    console.log(`✅ Using tenant: ${tenantId}\n`);
    
    // Step 1: Create Users
    console.log('👥 Creating users...');
    
    const cargoOwnerId = await getOrCreateUser(
      'cargo.owner@test.com',
      '+254712345678',
      'CARGO_OWNER',
      tenantId,
      'John',
      'Doe',
      'Electronics Co.'
    );
    console.log(`✅ Cargo Owner: ${cargoOwnerId}`);
    
    const cargoOwner2Id = await getOrCreateUser(
      'cargo.owner2@test.com',
      '+254723456789',
      'CARGO_OWNER',
      tenantId,
      'Mary',
      'Wanjiku',
      'Farm Fresh Ltd'
    );
    console.log(`✅ Cargo Owner 2: ${cargoOwner2Id}`);
    
    const truckOwnerId = await getOrCreateUser(
      'truck.owner@test.com',
      '+254734567890',
      'TRUCK_OWNER',
      tenantId,
      'James',
      'Mwangi',
      'Test Trucking Company'
    );
    console.log(`✅ Truck Owner: ${truckOwnerId}`);
    
    const truckOwner2Id = await getOrCreateUser(
      'truck.owner2@test.com',
      '+254745678901',
      'TRUCK_OWNER',
      tenantId,
      'Peter',
      'Ochieng',
      'Premium Transport Ltd'
    );
    console.log(`✅ Truck Owner 2: ${truckOwner2Id}`);
    
    // Create drivers
    const driver1Id = await getOrCreateUser(
      'driver1@test.com',
      '+254756789012',
      'DRIVER',
      tenantId,
      'David',
      'Kamau',
      null
    );
    console.log(`✅ Driver 1: ${driver1Id}`);
    
    const driver2Id = await getOrCreateUser(
      'driver2@test.com',
      '+254767890123',
      'DRIVER',
      tenantId,
      'Samuel',
      'Onyango',
      null
    );
    console.log(`✅ Driver 2: ${driver2Id}`);
    
    console.log('✅ Users created!\n');
    
    // Step 2: Create Locations
    console.log('📍 Creating locations...');
    
    const locations = {
      nairobi: await createLocation(
        tenantId,
        'Nairobi Warehouse',
        'Industrial Area, Nairobi',
        'Nairobi',
        'Nairobi County',
        'Kenya',
        -1.2921,
        36.8219
      ),
      mombasa: await createLocation(
        tenantId,
        'Mombasa Port',
        'Port Road, Mombasa',
        'Mombasa',
        'Mombasa County',
        'Kenya',
        -4.0435,
        39.6682
      ),
      kisumu: await createLocation(
        tenantId,
        'Kisumu Distribution Center',
        'Kisumu Road, Kisumu',
        'Kisumu',
        'Kisumu County',
        'Kenya',
        -0.0917,
        34.7680
      ),
      nakuru: await createLocation(
        tenantId,
        'Nakuru Storage',
        'Nakuru Town, Nakuru',
        'Nakuru',
        'Nakuru County',
        'Kenya',
        -0.3031,
        36.0800
      )
    };
    
    console.log('✅ Locations created!\n');
    
    // Step 3: Create Trucks
    console.log('🚛 Creating trucks...');
    
    const trucks = [];
    const truckData = [
      {
        plateNumber: 'KCA 123X',
        make: 'Mercedes',
        model: 'Actros',
        year: 2022,
        capacity: 20000,
        ownerId: truckOwnerId
      },
      {
        plateNumber: 'KCB 456Y',
        make: 'Volvo',
        model: 'FH16',
        year: 2021,
        capacity: 25000,
        ownerId: truckOwnerId
      },
      {
        plateNumber: 'KCC 789Z',
        make: 'Scania',
        model: 'R500',
        year: 2023,
        capacity: 22000,
        ownerId: truckOwner2Id
      },
      {
        plateNumber: 'KCD 012A',
        make: 'MAN',
        model: 'TGX',
        year: 2020,
        capacity: 18000,
        ownerId: truckOwner2Id
      }
    ];
    
    for (const truck of truckData) {
      const truckId = generateUUID();
      await pool.query(`
        INSERT INTO trucks (
          id, "tenantId", "ownerId", "plateNumber", make, model, year, capacity, status, "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      `, [
        truckId,
        tenantId,
        truck.ownerId,
        truck.plateNumber,
        truck.make,
        truck.model,
        truck.year,
        truck.capacity,
        'ACTIVE'
      ]);
      trucks.push({ id: truckId, ...truck });
    }
    
    console.log(`✅ Created ${trucks.length} trucks!\n`);
    
    // Step 4: Create Drivers (in drivers table)
    console.log('👨‍✈️ Creating driver records...');
    
    const drivers = [];
    const driverRecords = [
      {
        userId: driver1Id,
        employerId: truckOwnerId,
        firstName: 'David',
        lastName: 'Kamau',
        email: 'driver1@test.com',
        phone: '+254756789012',
        licenseNumber: 'DL-12345',
        dateOfBirth: new Date('1990-01-15'),
        address: 'Nairobi, Kenya',
        licenseIssueDate: new Date('2020-01-01'),
        licenseExpiry: new Date('2025-12-31'),
        licenseState: 'Nairobi',
        licenseCountry: 'Kenya',
        hireDate: new Date('2022-01-01'),
        status: 'ACTIVE',
        availabilityStatus: 'AVAILABLE'
      },
      {
        userId: driver2Id,
        employerId: truckOwnerId,
        firstName: 'Samuel',
        lastName: 'Onyango',
        email: 'driver2@test.com',
        phone: '+254767890123',
        licenseNumber: 'DL-67890',
        dateOfBirth: new Date('1988-05-20'),
        address: 'Nairobi, Kenya',
        licenseIssueDate: new Date('2019-06-01'),
        licenseExpiry: new Date('2024-12-31'),
        licenseState: 'Nairobi',
        licenseCountry: 'Kenya',
        hireDate: new Date('2021-03-01'),
        status: 'ACTIVE',
        availabilityStatus: 'AVAILABLE'
      }
    ];
    
    for (const driver of driverRecords) {
      const driverRecordId = generateUUID();
      await pool.query(`
        INSERT INTO drivers (
          id, "tenantId", "userId", "employerId", "firstName", "lastName", email, phone,
          "licenseNumber", "dateOfBirth", address, "licenseIssueDate", "licenseExpiry",
          "licenseState", "licenseCountry", "hireDate", status, "availabilityStatus",
          "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW())
      `, [
        driverRecordId,
        tenantId,
        driver.userId,
        driver.employerId,
        driver.firstName,
        driver.lastName,
        driver.email,
        driver.phone,
        driver.licenseNumber,
        driver.dateOfBirth,
        driver.address,
        driver.licenseIssueDate,
        driver.licenseExpiry,
        driver.licenseState,
        driver.licenseCountry,
        driver.hireDate,
        driver.status,
        driver.availabilityStatus
      ]);
      drivers.push({ id: driverRecordId, userId: driver.userId });
    }
    
    console.log(`✅ Created ${drivers.length} driver records!\n`);
    
    // Step 5: Create Cargo Shipments (PUBLISHED for auctions)
    console.log('📦 Creating cargo shipments...');
    
    const cargoShipments = [];
    const cargoData = [
      {
        title: 'Electronics Shipment - Nairobi to Mombasa',
        description: 'Fragile electronics requiring careful handling',
        weight: 5000,
        volume: 25,
        cargoOwnerId: cargoOwnerId,
        pickupLocationId: locations.nairobi,
        deliveryLocationId: locations.mombasa,
        pickupDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        deliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        status: 'PUBLISHED',
        estimatedValue: 50000
      },
      {
        title: 'Agricultural Products - Kisumu to Nairobi',
        description: 'Fresh produce requiring temperature control',
        weight: 8000,
        volume: 40,
        cargoOwnerId: cargoOwner2Id,
        pickupLocationId: locations.kisumu,
        deliveryLocationId: locations.nairobi,
        pickupDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        deliveryDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        status: 'PUBLISHED',
        estimatedValue: 30000
      },
      {
        title: 'Construction Materials - Nairobi to Nakuru',
        description: 'Heavy construction materials',
        weight: 15000,
        volume: 60,
        cargoOwnerId: cargoOwnerId,
        pickupLocationId: locations.nairobi,
        deliveryLocationId: locations.nakuru,
        pickupDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        deliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        status: 'PUBLISHED',
        estimatedValue: 75000
      },
      {
        title: 'Textiles - Mombasa to Kisumu',
        description: 'Textile products for distribution',
        weight: 6000,
        volume: 30,
        cargoOwnerId: cargoOwner2Id,
        pickupLocationId: locations.mombasa,
        deliveryLocationId: locations.kisumu,
        pickupDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        deliveryDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
        status: 'PUBLISHED',
        estimatedValue: 40000
      },
      {
        title: 'Medical Supplies - Nairobi to Mombasa',
        description: 'Urgent medical supplies delivery',
        weight: 3000,
        volume: 15,
        cargoOwnerId: cargoOwnerId,
        pickupLocationId: locations.nairobi,
        deliveryLocationId: locations.mombasa,
        pickupDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        deliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        status: 'PUBLISHED',
        estimatedValue: 100000
      }
    ];
    
    for (const cargo of cargoData) {
      const cargoId = generateUUID();
      
      // Create locations array
      const locationsArray = [
        {
          id: generateUUID(),
          type: 'PICKUP',
          sequence: 1,
          locationData: {
            name: cargo.pickupLocationId === locations.nairobi ? 'Nairobi Warehouse' :
                  cargo.pickupLocationId === locations.mombasa ? 'Mombasa Port' :
                  cargo.pickupLocationId === locations.kisumu ? 'Kisumu Distribution Center' :
                  'Nakuru Storage',
            address: 'Address',
            city: 'City',
            state: 'State',
            country: 'Kenya',
            coordinates: {
              latitude: -1.2921,
              longitude: 36.8219
            }
          },
          scheduledDate: cargo.pickupDate,
          estimatedTime: 60
        },
        {
          id: generateUUID(),
          type: 'DELIVERY',
          sequence: 2,
          locationData: {
            name: cargo.deliveryLocationId === locations.nairobi ? 'Nairobi Warehouse' :
                  cargo.deliveryLocationId === locations.mombasa ? 'Mombasa Port' :
                  cargo.deliveryLocationId === locations.kisumu ? 'Kisumu Distribution Center' :
                  'Nakuru Storage',
            address: 'Address',
            city: 'City',
            state: 'State',
            country: 'Kenya',
            coordinates: {
              latitude: -4.0435,
              longitude: 39.6682
            }
          },
          scheduledDate: cargo.deliveryDate,
          estimatedTime: 60
        }
      ];
      
      await pool.query(`
        INSERT INTO loads (
          id, "tenantId", "cargoOwnerId", title, description, weight, volume,
          "pickupLocationId", "deliveryLocationId", "pickupDate", "deliveryDate",
          status, visibility, "estimatedValue", locations, "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
      `, [
        cargoId,
        tenantId,
        cargo.cargoOwnerId,
        cargo.title,
        cargo.description,
        cargo.weight,
        cargo.volume,
        cargo.pickupLocationId,
        cargo.deliveryLocationId,
        cargo.pickupDate,
        cargo.deliveryDate,
        cargo.status,
        'PUBLIC',
        cargo.estimatedValue,
        JSON.stringify(locationsArray)
      ]);
      
      cargoShipments.push({ id: cargoId, ...cargo });
    }
    
    console.log(`✅ Created ${cargoShipments.length} cargo shipments!\n`);
    
    // Step 6: Create Auctions (ACTIVE status)
    console.log('🔨 Creating auctions...');
    
    const auctions = [];
    for (let i = 0; i < cargoShipments.length; i++) {
      const cargo = cargoShipments[i];
      const auctionId = generateUUID();
      const auctionStart = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000); // Started 1 day ago
      const auctionEnd = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // Ends in 2 days
      
      await pool.query(`
        INSERT INTO auctions (
          id, "loadId", "auctionType", status, "auctionStart", "auctionEnd",
          "reservePrice", "minimumBidIncrement", "totalBids", "uniqueBidders",
          "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      `, [
        auctionId,
        cargo.id,
        'REVERSE',
        'ACTIVE',
        auctionStart,
        auctionEnd,
        cargo.estimatedValue * 0.8, // 80% of estimated value as reserve
        100, // Minimum bid increment
        0,
        0
      ]);
      
      auctions.push({ id: auctionId, loadId: cargo.id });
    }
    
    console.log(`✅ Created ${auctions.length} active auctions!\n`);
    
    // Step 7: Create Bids
    console.log('💰 Creating bids...');
    
    let bidCount = 0;
    for (let i = 0; i < auctions.length; i++) {
      const auction = auctions[i];
      const cargo = cargoShipments[i];
      
      // Create 2-3 bids per auction from different truck owners
      const numBids = Math.floor(Math.random() * 2) + 2; // 2 or 3 bids
      
      for (let j = 0; j < numBids; j++) {
        const bidId = generateUUID();
        const bidderId = j % 2 === 0 ? truckOwnerId : truckOwner2Id;
        const baseAmount = cargo.estimatedValue * 0.7; // Start at 70% of estimated value
        const bidAmount = baseAmount - (j * 500); // Decreasing bids
        
        await pool.query(`
          INSERT INTO bids (
            id, "loadId", "truckOwnerId", "bidAmount", "bidCurrency", status,
            "proposedPickupDate", "proposedDeliveryDate", "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        `, [
          bidId,
          cargo.id,
          bidderId,
          bidAmount,
          'USD',
          'PENDING',
          cargo.pickupDate,
          cargo.deliveryDate
        ]);
        
        bidCount++;
      }
      
      // Update auction with bid counts
      await pool.query(`
        UPDATE auctions 
        SET "totalBids" = $1, "uniqueBidders" = $2, "currentHighestBid" = $3
        WHERE id = $4
      `, [numBids, 2, baseAmount, auction.id]);
    }
    
    console.log(`✅ Created ${bidCount} bids!\n`);
    
    // Step 8: Create Trips (PLANNED and COMPLETED)
    console.log('🚗 Creating trips...');
    
    const trips = [];
    
    // Create 2 PLANNED trips
    for (let i = 0; i < 2; i++) {
      const tripId = generateUUID();
      const cargo = cargoShipments[i];
      const truck = trucks[i];
      const driver = drivers[i % drivers.length];
      
      await pool.query(`
        INSERT INTO trips (
          id, "tenantId", "tripNumber", "loadId", "truckId", "driverId",
          status, "agreedPrice", "currencyCode", "plannedStartTime", "plannedEndTime",
          "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      `, [
        tripId,
        tenantId,
        `TRIP-2024-${String(i + 1).padStart(3, '0')}`,
        cargo.id,
        truck.id,
        driver.userId,
        'PLANNED',
        cargo.estimatedValue * 0.75,
        'USD',
        cargo.pickupDate,
        cargo.deliveryDate
      ]);
      
      trips.push({ id: tripId, status: 'PLANNED', loadId: cargo.id });
    }
    
    // Create 2 COMPLETED trips
    for (let i = 2; i < 4; i++) {
      const tripId = generateUUID();
      const cargo = cargoShipments[i];
      const truck = trucks[i % trucks.length];
      const driver = drivers[i % drivers.length];
      
      const plannedStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const plannedEnd = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
      const actualStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const actualEnd = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
      
      await pool.query(`
        INSERT INTO trips (
          id, "tenantId", "tripNumber", "loadId", "truckId", "driverId",
          status, "agreedPrice", "currencyCode", "plannedStartTime", "plannedEndTime",
          "actualStartTime", "actualEndTime", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
      `, [
        tripId,
        tenantId,
        `TRIP-2024-${String(i + 1).padStart(3, '0')}`,
        cargo.id,
        truck.id,
        driver.userId,
        'COMPLETED',
        cargo.estimatedValue * 0.75,
        'USD',
        plannedStart,
        plannedEnd,
        actualStart,
        actualEnd
      ]);
      
      trips.push({ id: tripId, status: 'COMPLETED', loadId: cargo.id, driverId: driver.userId });
    }
    
    console.log(`✅ Created ${trips.length} trips!\n`);
    
    // Step 9: Create Payments
    console.log('💳 Creating payments...');
    
    // Create advance payments for PLANNED trips
    for (const trip of trips.filter(t => t.status === 'PLANNED')) {
      const paymentId = generateUUID();
      const tripData = await pool.query('SELECT "agreedPrice", "driverId" FROM trips WHERE id = $1', [trip.id]);
      if (tripData.rows.length > 0) {
        const amount = tripData.rows[0].agreedPrice * 0.3; // 30% advance
        
        await pool.query(`
          INSERT INTO payments (
            id, "tenantId", "tripId", "payerId", amount, currency, "paymentMethod",
            "paymentType", status, description, "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        `, [
          paymentId,
          tenantId,
          trip.id,
          truckOwnerId, // Truck owner pays driver
          amount,
          'USD',
          'MOBILE_MONEY',
          'advance',
          'completed',
          `Advance payment for trip ${trip.id}`
        ]);
      }
    }
    
    // Create final payments for COMPLETED trips (some paid, some unpaid)
    for (let i = 0; i < trips.filter(t => t.status === 'COMPLETED').length; i++) {
      const trip = trips.filter(t => t.status === 'COMPLETED')[i];
      const tripData = await pool.query('SELECT "agreedPrice", "loadId" FROM trips WHERE id = $1', [trip.id]);
      if (tripData.rows.length > 0) {
        const loadData = await pool.query('SELECT "cargoOwnerId" FROM loads WHERE id = $1', [trip.loadId]);
        if (loadData.rows.length > 0) {
          const cargoOwnerId = loadData.rows[0].cargoOwnerId;
          const amount = tripData.rows[0].agreedPrice;
          
          // First completed trip is paid, second is unpaid
          const isPaid = i === 0;
          
          if (isPaid) {
            const paymentId = generateUUID();
            await pool.query(`
              INSERT INTO payments (
                id, "tenantId", "tripId", "payerId", amount, currency, "paymentMethod",
                "paymentType", status, description, "processedAt", "createdAt", "updatedAt"
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW(), NOW())
            `, [
              paymentId,
              tenantId,
              trip.id,
              cargoOwnerId,
              amount,
              'USD',
              'MOBILE_MONEY',
              'final',
              'completed',
              `Final payment for trip ${trip.id}`
            ]);
          }
        }
      }
    }
    
    console.log('✅ Payments created!\n');
    
    // Step 10: Create Routes
    console.log('🗺️ Creating routes...');
    
    const routeData = [
      {
        name: 'Nairobi to Mombasa',
        originId: locations.nairobi,
        destinationId: locations.mombasa,
        distance: 485,
        estimatedDuration: 480
      },
      {
        name: 'Kisumu to Nairobi',
        originId: locations.kisumu,
        destinationId: locations.nairobi,
        distance: 345,
        estimatedDuration: 360
      },
      {
        name: 'Nairobi to Nakuru',
        originId: locations.nairobi,
        destinationId: locations.nakuru,
        distance: 160,
        estimatedDuration: 180
      }
    ];
    
    for (const route of routeData) {
      const routeId = generateUUID();
      await pool.query(`
        INSERT INTO routes (
          id, "tenantId", name, "originId", "destinationId", distance,
          "estimatedDuration", status, "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      `, [
        routeId,
        tenantId,
        route.name,
        route.originId,
        route.destinationId,
        route.distance,
        route.estimatedDuration,
        'ACTIVE'
      ]);
    }
    
    console.log(`✅ Created ${routeData.length} routes!\n`);
    
    console.log('\n✅ Complete system seeding finished successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Users: ${4} (2 cargo owners, 2 truck owners, 2 drivers)`);
    console.log(`   - Trucks: ${trucks.length}`);
    console.log(`   - Cargo Shipments: ${cargoShipments.length} (all PUBLISHED)`);
    console.log(`   - Auctions: ${auctions.length} (all ACTIVE)`);
    console.log(`   - Bids: ${bidCount}`);
    console.log(`   - Trips: ${trips.length} (2 PLANNED, 2 COMPLETED)`);
    console.log(`   - Routes: ${routeData.length}`);
    console.log('\n🎉 All data seeded successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the script
if (require.main === module) {
  seedCompleteSystem()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { seedCompleteSystem };

