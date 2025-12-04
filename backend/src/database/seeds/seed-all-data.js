#!/usr/bin/env node

/**
 * 🚀 COMPREHENSIVE DATABASE SEEDER
 * 
 * This script populates the database with ALL required data for both
 * cargo owners and truck owners to ensure all functionalities work:
 * - Users (cargo owners, truck owners, drivers)
 * - Cargo shipments (PUBLISHED for auctions, DRAFT, ACTIVE, COMPLETED)
 * - Active auctions with bids
 * - Trucks and drivers
 * - Trips (PLANNED and COMPLETED)
 * - Payments (advance and final)
 * - Locations
 * - Routes
 * 
 * Run with: node src/database/seeds/seed-all-data.js
 */

const { Pool } = require('pg');
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'urutix_database',
  user: process.env.DB_USERNAME || 'dev',
  password: process.env.DB_PASSWORD || 'password',
});

function generateUUID() {
  return uuidv4();
}

async function getOrCreateTenant() {
  const result = await pool.query(
    'SELECT id FROM tenants WHERE "isActive" = true LIMIT 1'
  );
  
  if (result.rows.length > 0) {
    return result.rows[0].id;
  }
  
  const tenantId = generateUUID();
  await pool.query(`
    INSERT INTO tenants (id, name, "isActive", "createdAt", "updatedAt")
    VALUES ($1, $2, $3, NOW(), NOW())
  `, [tenantId, 'Default Tenant', true]);
  
  return tenantId;
}

async function getOrCreateUser(email, phone, role, tenantId, firstName, lastName, companyName) {
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  
  if (existing.rows.length > 0) {
    const userId = existing.rows[0].id;
    // Update password and status to ensure it works
    const passwordHash = await bcrypt.hash('test123', 10);
    await pool.query(`
      UPDATE users 
      SET "passwordHash" = $1, status = $2, role = $3
      WHERE id = $4
    `, [passwordHash, 'ACTIVE', role, userId]);
    return userId;
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
    ON CONFLICT ("userId") DO UPDATE SET
      "firstName" = EXCLUDED."firstName",
      "lastName" = EXCLUDED."lastName",
      "companyName" = EXCLUDED."companyName"
  `, [profileId, userId, tenantId, firstName, lastName, companyName]);
  
  return userId;
}

async function createLocation(tenantId, name, address, city, state, country, lat, lng) {
  const locationId = generateUUID();
  // Check if location already exists
  const existing = await pool.query('SELECT id FROM locations WHERE name = $1 AND "tenantId" = $2', [name, tenantId]);
  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }
  
  // Use PostGIS ST_MakePoint for geometry
  await pool.query(`
    INSERT INTO locations (
      id, "tenantId", name, address, city, state, country, coordinates, "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, ST_SetSRID(ST_MakePoint($8, $9), 4326), NOW(), NOW())
  `, [locationId, tenantId, name, address, city, state, country, lng, lat]);
  
  return locationId;
}

async function createLoad(tenantId, cargoOwnerId, loadData) {
  const loadId = generateUUID();
  const pickupLocationId = loadData.pickupLocationId;
  const deliveryLocationId = loadData.deliveryLocationId;
  
  // Create locations array for the load
  const pickupLocation = await pool.query('SELECT name, address, city, state, country FROM locations WHERE id = $1', [pickupLocationId]);
  const deliveryLocation = await pool.query('SELECT name, address, city, state, country FROM locations WHERE id = $1', [deliveryLocationId]);
  
  const locationsArray = [
    {
      id: generateUUID(),
      type: 'PICKUP',
      sequence: 1,
      locationData: pickupLocation.rows[0] || {
        name: 'Pickup Location',
        address: '',
        city: '',
        state: '',
        country: 'Kenya'
      },
      scheduledDate: loadData.pickupDate,
      estimatedTime: 60
    },
    {
      id: generateUUID(),
      type: 'DELIVERY',
      sequence: 2,
      locationData: deliveryLocation.rows[0] || {
        name: 'Delivery Location',
        address: '',
        city: '',
        state: '',
        country: 'Kenya'
      },
      scheduledDate: loadData.deliveryDate,
      estimatedTime: 60
    }
  ];
  
  // Create origin and destination from location data
  const origin = {
    name: pickupLocation.rows[0]?.name || 'Pickup Location',
    address: pickupLocation.rows[0]?.address || '',
    city: pickupLocation.rows[0]?.city || '',
    state: pickupLocation.rows[0]?.state || '',
    country: pickupLocation.rows[0]?.country || 'Kenya'
  };
  
  const destination = {
    name: deliveryLocation.rows[0]?.name || 'Delivery Location',
    address: deliveryLocation.rows[0]?.address || '',
    city: deliveryLocation.rows[0]?.city || '',
    state: deliveryLocation.rows[0]?.state || '',
    country: deliveryLocation.rows[0]?.country || 'Kenya'
  };
  
  await pool.query(`
    INSERT INTO loads (
      id, "tenantId", "cargoOwnerId", title, description, status,
      "cargoType", weight, volume, "loadValue", "currencyCode",
      "pickupDate", "deliveryDate", "urgencyLevel", 
      locations, "createdAt", "updatedAt"
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW()
    )
  `, [
    loadId, tenantId, cargoOwnerId, loadData.title, loadData.description, loadData.status,
    loadData.cargoType || 'GENERAL', loadData.weight || 1000,
    loadData.volume || 10, loadData.value || 5000, loadData.currency || 'USD',
    loadData.pickupDate, loadData.deliveryDate,
    loadData.urgencyLevel || 'NORMAL',
    JSON.stringify(locationsArray)
  ]);
  
  return loadId;
}

async function createAuction(tenantId, loadId, auctionData) {
  const auctionId = generateUUID();
  await pool.query(`
    INSERT INTO auctions (
      id, "loadId", "auctionType", status, "auctionStart", "auctionEnd",
      "reservePrice", "minimumBidIncrement", "totalBids", "uniqueBidders",
      "currentHighestBid", "createdAt", "updatedAt"
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()
    )
  `, [
    auctionId, loadId, auctionData.auctionType || 'REVERSE',
    auctionData.status || 'ACTIVE', auctionData.auctionStart, auctionData.auctionEnd,
    auctionData.reservePrice || 1000, auctionData.minimumBidIncrement || 50,
    auctionData.totalBids || 0, auctionData.uniqueBidders || 0,
    auctionData.currentHighestBid || null
  ]);
  
  return auctionId;
}

async function createBid(tenantId, loadId, truckOwnerId, bidData) {
  const bidId = generateUUID();
  await pool.query(`
    INSERT INTO bids (
      id, "loadId", "truckOwnerId", "bidAmount", "bidCurrency", status,
      "proposedPickupDate", "proposedDeliveryDate", "bidNotes", "bidDetails", "createdAt", "updatedAt"
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()
    )
  `, [
    bidId, loadId, truckOwnerId, bidData.bidAmount, bidData.bidCurrency || 'USD',
    bidData.status || 'PENDING', bidData.proposedPickupDate || null,
    bidData.proposedDeliveryDate || null, bidData.bidNotes || null,
    JSON.stringify(bidData.bidDetails || {})
  ]);
  
  return bidId;
}

async function createTruck(tenantId, ownerId, truckData) {
  // Check if truck already exists
  const existing = await pool.query('SELECT id FROM trucks WHERE "plateNumber" = $1 AND "tenantId" = $2', [truckData.plateNumber, tenantId]);
  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }
  
  const truckId = generateUUID();
  const vin = `VIN${Math.random().toString(36).substring(2, 15).toUpperCase()}`;
  const registrationNumber = truckData.plateNumber || `REG${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  const registrationExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 year from now
  const insurancePolicy = `POL-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  const insuranceExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 year from now
  await pool.query(`
    INSERT INTO trucks (
      id, "tenantId", "ownerId", "plateNumber", "registrationNumber", "registrationExpiry", "insurancePolicy", "insuranceExpiry", vin, make, model, year, "truckType",
      status, "capacityWeight", "capacityVolume"
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
    )
  `, [
    truckId, tenantId, ownerId, truckData.plateNumber, registrationNumber, registrationExpiry, insurancePolicy, insuranceExpiry, vin, truckData.make, truckData.model,
    truckData.year || 2020, truckData.truckType || 'FLATBED', truckData.status || 'AVAILABLE',
    truckData.capacityWeight || 20000, truckData.capacityVolume || 50
  ]);
  
  return truckId;
}

async function createDriver(tenantId, ownerId, driverData) {
  // Check if driver already exists
  const existing = await pool.query('SELECT id FROM drivers WHERE "licenseNumber" = $1', [driverData.licenseNumber]);
  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }
  
  // First, get the userId from the email
  const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [driverData.email]);
  if (userResult.rows.length === 0) {
    throw new Error(`User not found for email: ${driverData.email}`);
  }
  const userId = userResult.rows[0].id;
  
  const driverId = generateUUID();
  await pool.query(`
    INSERT INTO drivers (
      id, "tenantId", "userId", "employerId", "firstName", "lastName", email, phone,
      "licenseNumber", "licenseExpiry", "licenseIssueDate", "licenseState", "licenseCountry",
      "dateOfBirth", address, status, "availabilityStatus",
      "hireDate"
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
    )
  `, [
    driverId, tenantId, userId, ownerId, driverData.firstName, driverData.lastName,
    driverData.email, driverData.phone, driverData.licenseNumber,
    driverData.licenseExpiry || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    driverData.licenseIssueDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
    driverData.licenseState || 'Nairobi',
    driverData.licenseCountry || 'Kenya',
    driverData.dateOfBirth || new Date(Date.now() - 30 * 365 * 24 * 60 * 60 * 1000).toISOString(),
    driverData.address || 'Nairobi, Kenya',
    driverData.status || 'ACTIVE', driverData.availabilityStatus || 'AVAILABLE',
    driverData.hireDate || new Date().toISOString()
  ]);
  
  return driverId;
}

async function createTrip(tenantId, loadId, truckId, driverId, tripData) {
  const tripId = generateUUID();
  const tripNumber = `TRIP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
  
  await pool.query(`
    INSERT INTO trips (
      id, "tenantId", "tripNumber", "loadId", "truckId", "driverId", status,
      "agreedPrice", "currencyCode", "plannedStartTime", "plannedEndTime",
      "actualStartTime", "actualEndTime", "createdAt", "updatedAt"
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW()
    )
  `, [
    tripId, tenantId, tripNumber, loadId, truckId, driverId, tripData.status || 'PLANNED',
    tripData.agreedPrice || 5000, tripData.currencyCode || 'USD',
    tripData.plannedStartTime, tripData.plannedEndTime,
    tripData.actualStartTime || null, tripData.actualEndTime || null
  ]);
  
  return tripId;
}

async function createPayment(tenantId, tripId, payerId, paymentData) {
  const paymentId = generateUUID();
  const invoiceId = paymentData.invoiceId || generateUUID(); // Generate invoiceId if not provided
  const invoiceNumber = paymentData.invoiceNumber || `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
  const customerId = paymentData.customerId || payerId; // Use payerId as customerId if not provided
  const customerName = paymentData.customerName || 'Customer'; // Default customer name
  const paymentDate = paymentData.paymentDate || new Date(); // Use current date if not provided
  const createdBy = paymentData.createdBy || payerId; // Use payerId as createdBy if not provided
  
  await pool.query(`
    INSERT INTO payments (
      id, "tenantId", "tripId", "payerId", amount, currency, "paymentMethod",
      "paymentType", status, description, metadata, "invoiceId", "invoiceNumber", 
      "customerId", "customerName", "paymentDate", "createdBy", "createdAt", "updatedAt"
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW()
    )
  `, [
    paymentId, tenantId, tripId, payerId, paymentData.amount, paymentData.currency || 'USD',
    paymentData.paymentMethod || 'credit_card', paymentData.paymentType || 'advance',
    paymentData.status || 'completed', paymentData.description || null,
    JSON.stringify(paymentData.metadata || {}), invoiceId, invoiceNumber,
    customerId, customerName, paymentDate, createdBy
  ]);
  
  return paymentId;
}

async function seedAllData() {
  console.log('🚀 Starting Comprehensive Database Seeding...\n');
  
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
    
    console.log('');
    
    // Step 2: Create Locations
    console.log('📍 Creating locations...');
    
    const nairobiLocationId = await createLocation(
      tenantId,
      'Nairobi Warehouse',
      'Industrial Area, Nairobi',
      'Nairobi',
      'Nairobi County',
      'Kenya',
      -1.2921,
      36.8219
    );
    
    const mombasaLocationId = await createLocation(
      tenantId,
      'Mombasa Port',
      'Port Area, Mombasa',
      'Mombasa',
      'Mombasa County',
      'Kenya',
      -4.0435,
      39.6682
    );
    
    const kisumuLocationId = await createLocation(
      tenantId,
      'Kisumu Depot',
      'Kisumu Industrial Area',
      'Kisumu',
      'Kisumu County',
      'Kenya',
      -0.0917,
      34.7680
    );
    
    const nakuruLocationId = await createLocation(
      tenantId,
      'Nakuru Distribution Center',
      'Nakuru Town',
      'Nakuru',
      'Nakuru County',
      'Kenya',
      -0.3031,
      36.0800
    );
    
    console.log('✅ Locations created\n');
    
    // Step 3: Create Loads (Cargo Shipments)
    console.log('📦 Creating cargo shipments...');
    
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    // PUBLISHED loads for auctions
    const load1Id = await createLoad(tenantId, cargoOwnerId, {
      title: 'Electronics Shipment - Nairobi to Mombasa',
      description: 'Fragile electronics requiring careful handling',
      status: 'PUBLISHED',
      cargoType: 'GENERAL',
      weight: 5000,
      volume: 25,
      value: 50000,
      pickupDate: tomorrow,
      deliveryDate: nextWeek,
      pickupLocationId: nairobiLocationId,
      deliveryLocationId: mombasaLocationId,
      urgencyLevel: 'HIGH'
    });
    console.log(`✅ Load 1 (PUBLISHED): ${load1Id}`);
    
    const load2Id = await createLoad(tenantId, cargoOwnerId, {
      title: 'Agricultural Products - Kisumu to Nairobi',
      description: 'Fresh produce requiring temperature control',
      status: 'PUBLISHED',
      cargoType: 'GENERAL',
      weight: 8000,
      volume: 40,
      value: 30000,
      pickupDate: tomorrow,
      deliveryDate: nextWeek,
      pickupLocationId: kisumuLocationId,
      deliveryLocationId: nairobiLocationId,
      urgencyLevel: 'HIGH'
    });
    console.log(`✅ Load 2 (PUBLISHED): ${load2Id}`);
    
    const load3Id = await createLoad(tenantId, cargoOwner2Id, {
      title: 'Construction Materials - Nakuru to Nairobi',
      description: 'Heavy construction materials',
      status: 'PUBLISHED',
      cargoType: 'GENERAL',
      weight: 15000,
      volume: 60,
      value: 75000,
      pickupDate: tomorrow,
      deliveryDate: nextWeek,
      pickupLocationId: nakuruLocationId,
      deliveryLocationId: nairobiLocationId,
      urgencyLevel: 'NORMAL'
    });
    console.log(`✅ Load 3 (PUBLISHED): ${load3Id}`);
    
    const load4Id = await createLoad(tenantId, cargoOwnerId, {
      title: 'Textiles - Nairobi to Kisumu',
      description: 'Clothing and textile products',
      status: 'PUBLISHED',
      cargoType: 'GENERAL',
      weight: 3000,
      volume: 20,
      value: 25000,
      pickupDate: tomorrow,
      deliveryDate: nextWeek,
      pickupLocationId: nairobiLocationId,
      deliveryLocationId: kisumuLocationId,
      urgencyLevel: 'NORMAL'
    });
    console.log(`✅ Load 4 (PUBLISHED): ${load4Id}`);
    
    const load5Id = await createLoad(tenantId, cargoOwner2Id, {
      title: 'Furniture - Mombasa to Nairobi',
      description: 'Office and home furniture',
      status: 'PUBLISHED',
      cargoType: 'GENERAL',
      weight: 4000,
      volume: 30,
      value: 40000,
      pickupDate: tomorrow,
      deliveryDate: nextWeek,
      pickupLocationId: mombasaLocationId,
      deliveryLocationId: nairobiLocationId,
      urgencyLevel: 'NORMAL'
    });
    console.log(`✅ Load 5 (PUBLISHED): ${load5Id}`);
    
    // COMPLETED load for completed trips
    const load6Id = await createLoad(tenantId, cargoOwnerId, {
      title: 'Completed Electronics Shipment',
      description: 'Already delivered shipment',
      status: 'COMPLETED',
      cargoType: 'GENERAL',
      weight: 5000,
      volume: 25,
      value: 50000,
      pickupDate: twoWeeksAgo,
      deliveryDate: lastWeek,
      pickupLocationId: nairobiLocationId,
      deliveryLocationId: mombasaLocationId,
      urgencyLevel: 'NORMAL'
    });
    console.log(`✅ Load 6 (COMPLETED): ${load6Id}`);
    
    console.log('');
    
    // Step 4: Create Auctions
    console.log('🔨 Creating auctions...');
    
    const auction1Id = await createAuction(tenantId, load1Id, {
      auctionType: 'REVERSE',
      status: 'ACTIVE',
      auctionStart: now,
      auctionEnd: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      reservePrice: 4000,
      minimumBidIncrement: 100,
      totalBids: 3,
      uniqueBidders: 2,
      currentHighestBid: 3800
    });
    console.log(`✅ Auction 1 (ACTIVE): ${auction1Id}`);
    
    const auction2Id = await createAuction(tenantId, load2Id, {
      auctionType: 'REVERSE',
      status: 'ACTIVE',
      auctionStart: now,
      auctionEnd: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      reservePrice: 6000,
      minimumBidIncrement: 150,
      totalBids: 5,
      uniqueBidders: 3,
      currentHighestBid: 5500
    });
    console.log(`✅ Auction 2 (ACTIVE): ${auction2Id}`);
    
    const auction3Id = await createAuction(tenantId, load3Id, {
      auctionType: 'REVERSE',
      status: 'ACTIVE',
      auctionStart: now,
      auctionEnd: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000),
      reservePrice: 8000,
      minimumBidIncrement: 200,
      totalBids: 2,
      uniqueBidders: 2,
      currentHighestBid: 7500
    });
    console.log(`✅ Auction 3 (ACTIVE): ${auction3Id}`);
    
    const auction4Id = await createAuction(tenantId, load4Id, {
      auctionType: 'REVERSE',
      status: 'ACTIVE',
      auctionStart: now,
      auctionEnd: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
      reservePrice: 3000,
      minimumBidIncrement: 50,
      totalBids: 4,
      uniqueBidders: 2,
      currentHighestBid: 2800
    });
    console.log(`✅ Auction 4 (ACTIVE): ${auction4Id}`);
    
    const auction5Id = await createAuction(tenantId, load5Id, {
      auctionType: 'REVERSE',
      status: 'ACTIVE',
      auctionStart: now,
      auctionEnd: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      reservePrice: 5000,
      minimumBidIncrement: 100,
      totalBids: 6,
      uniqueBidders: 3,
      currentHighestBid: 4500
    });
    console.log(`✅ Auction 5 (ACTIVE): ${auction5Id}`);
    
    console.log('');
    
    // Step 5: Create Bids
    console.log('💰 Creating bids...');
    
    await createBid(tenantId, load1Id, truckOwnerId, {
      bidAmount: 3800,
      status: 'PENDING',
      bidNotes: 'Experienced driver, excellent track record'
    });
    
    await createBid(tenantId, load1Id, truckOwner2Id, {
      bidAmount: 3900,
      status: 'PENDING',
      bidNotes: 'Premium service with GPS tracking'
    });
    
    await createBid(tenantId, load1Id, truckOwnerId, {
      bidAmount: 3750,
      status: 'PENDING',
      bidNotes: 'Best price guarantee'
    });
    
    await createBid(tenantId, load2Id, truckOwnerId, {
      bidAmount: 5500,
      status: 'PENDING',
      bidNotes: 'Refrigerated truck available'
    });
    
    await createBid(tenantId, load2Id, truckOwner2Id, {
      bidAmount: 5600,
      status: 'PENDING',
      bidNotes: 'Fast delivery guaranteed'
    });
    
    await createBid(tenantId, load2Id, truckOwnerId, {
      bidAmount: 5400,
      status: 'PENDING'
    });
    
    await createBid(tenantId, load2Id, truckOwner2Id, {
      bidAmount: 5700,
      status: 'PENDING'
    });
    
    await createBid(tenantId, load2Id, truckOwnerId, {
      bidAmount: 5300,
      status: 'PENDING'
    });
    
    await createBid(tenantId, load3Id, truckOwnerId, {
      bidAmount: 7500,
      status: 'PENDING'
    });
    
    await createBid(tenantId, load3Id, truckOwner2Id, {
      bidAmount: 7600,
      status: 'PENDING'
    });
    
    await createBid(tenantId, load4Id, truckOwnerId, {
      bidAmount: 2800,
      status: 'PENDING'
    });
    
    await createBid(tenantId, load4Id, truckOwner2Id, {
      bidAmount: 2900,
      status: 'PENDING'
    });
    
    await createBid(tenantId, load4Id, truckOwnerId, {
      bidAmount: 2750,
      status: 'PENDING'
    });
    
    await createBid(tenantId, load4Id, truckOwner2Id, {
      bidAmount: 3000,
      status: 'PENDING'
    });
    
    await createBid(tenantId, load5Id, truckOwnerId, {
      bidAmount: 4500,
      status: 'PENDING'
    });
    
    await createBid(tenantId, load5Id, truckOwner2Id, {
      bidAmount: 4600,
      status: 'PENDING'
    });
    
    await createBid(tenantId, load5Id, truckOwnerId, {
      bidAmount: 4400,
      status: 'PENDING'
    });
    
    await createBid(tenantId, load5Id, truckOwner2Id, {
      bidAmount: 4700,
      status: 'PENDING'
    });
    
    await createBid(tenantId, load5Id, truckOwnerId, {
      bidAmount: 4300,
      status: 'PENDING'
    });
    
    await createBid(tenantId, load5Id, truckOwner2Id, {
      bidAmount: 4800,
      status: 'PENDING'
    });
    
    console.log('✅ Bids created\n');
    
    // Step 6: Create Trucks
    console.log('🚛 Creating trucks...');
    
    const truck1Id = await createTruck(tenantId, truckOwnerId, {
      plateNumber: 'KCA 123X',
      make: 'Mercedes',
      model: 'Actros',
      year: 2020,
      truckType: 'FLATBED',
      status: 'AVAILABLE',
      capacityWeight: 20000,
      capacityVolume: 50
    });
    console.log(`✅ Truck 1: ${truck1Id}`);
    
    const truck2Id = await createTruck(tenantId, truckOwnerId, {
      plateNumber: 'KCB 456Y',
      make: 'Volvo',
      model: 'FH16',
      year: 2021,
      truckType: 'REFRIGERATED',
      status: 'AVAILABLE',
      capacityWeight: 18000,
      capacityVolume: 45
    });
    console.log(`✅ Truck 2: ${truck2Id}`);
    
    const truck3Id = await createTruck(tenantId, truckOwner2Id, {
      plateNumber: 'KCC 789Z',
      make: 'Scania',
      model: 'R450',
      year: 2019,
      truckType: 'CONTAINER',
      status: 'AVAILABLE',
      capacityWeight: 25000,
      capacityVolume: 60
    });
    console.log(`✅ Truck 3: ${truck3Id}`);
    
    const truck4Id = await createTruck(tenantId, truckOwnerId, {
      plateNumber: 'KCD 012A',
      make: 'MAN',
      model: 'TGX',
      year: 2022,
      truckType: 'FLATBED',
      status: 'IN_TRANSIT',
      capacityWeight: 22000,
      capacityVolume: 55
    });
    console.log(`✅ Truck 4: ${truck4Id}`);
    
    console.log('');
    
    // Step 7: Create Drivers (in drivers table)
    console.log('👨‍✈️ Creating drivers...');
    
    const driver1RecordId = await createDriver(tenantId, truckOwnerId, {
      firstName: 'David',
      lastName: 'Kamau',
      email: 'driver1@test.com',
      phone: '+254756789012',
      licenseNumber: 'DL-12345',
      status: 'ACTIVE',
      availabilityStatus: 'AVAILABLE'
    });
    console.log(`✅ Driver Record 1: ${driver1RecordId}`);
    
    const driver2RecordId = await createDriver(tenantId, truckOwnerId, {
      firstName: 'Samuel',
      lastName: 'Onyango',
      email: 'driver2@test.com',
      phone: '+254767890123',
      licenseNumber: 'DL-67890',
      status: 'ACTIVE',
      availabilityStatus: 'AVAILABLE'
    });
    console.log(`✅ Driver Record 2: ${driver2RecordId}`);
    
    // Create a third driver user first
    const driver3UserId = await getOrCreateUser(
      'driver3@test.com',
      '+254778901234',
      'DRIVER',
      tenantId,
      'Michael',
      'Kipchoge',
      null
    );
    console.log(`✅ Driver 3 User: ${driver3UserId}`);
    
    const driver3RecordId = await createDriver(tenantId, truckOwner2Id, {
      firstName: 'Michael',
      lastName: 'Kipchoge',
      email: 'driver3@test.com',
      phone: '+254778901234',
      licenseNumber: 'DL-11111',
      status: 'ACTIVE',
      availabilityStatus: 'AVAILABLE'
    });
    console.log(`✅ Driver Record 3: ${driver3RecordId}`);
    
    console.log('');
    
    // Step 8: Create Trips
    console.log('🚚 Creating trips...');
    
    // PLANNED trip
    const trip1Id = await createTrip(tenantId, load1Id, truck1Id, driver1RecordId, {
      status: 'PLANNED',
      agreedPrice: 5000,
      plannedStartTime: tomorrow,
      plannedEndTime: nextWeek
    });
    console.log(`✅ Trip 1 (PLANNED): ${trip1Id}`);
    
    // COMPLETED trip
    const trip2Id = await createTrip(tenantId, load6Id, truck2Id, driver2RecordId, {
      status: 'COMPLETED',
      agreedPrice: 7500,
      plannedStartTime: twoWeeksAgo,
      plannedEndTime: lastWeek,
      actualStartTime: twoWeeksAgo,
      actualEndTime: lastWeek
    });
    console.log(`✅ Trip 2 (COMPLETED): ${trip2Id}`);
    
    // Another PLANNED trip
    const trip3Id = await createTrip(tenantId, load2Id, truck3Id, driver3RecordId, {
      status: 'PLANNED',
      agreedPrice: 6000,
      plannedStartTime: tomorrow,
      plannedEndTime: nextWeek
    });
    console.log(`✅ Trip 3 (PLANNED): ${trip3Id}`);
    
    // Another COMPLETED trip
    const trip4Id = await createTrip(tenantId, load6Id, truck4Id, driver1RecordId, {
      status: 'COMPLETED',
      agreedPrice: 8000,
      plannedStartTime: twoWeeksAgo,
      plannedEndTime: lastWeek,
      actualStartTime: twoWeeksAgo,
      actualEndTime: lastWeek
    });
    console.log(`✅ Trip 4 (COMPLETED): ${trip4Id}`);
    
    console.log('');
    
    // Step 9: Create Payments
    console.log('💳 Creating payments...');
    
    // Advance payment for PLANNED trip
    await createPayment(tenantId, trip1Id, truckOwnerId, {
      amount: 1500, // 30% of 5000
      paymentType: 'advance',
      status: 'completed',
      description: 'Advance payment to driver before trip',
      metadata: {
        recipientNumber: '+254756789012',
        paymentMethod: 'credit_card'
      }
    });
    console.log('✅ Advance payment for trip 1');
    
    // Final payment for COMPLETED trip
    await createPayment(tenantId, trip2Id, cargoOwnerId, {
      amount: 7500,
      paymentType: 'final',
      status: 'completed',
      description: 'Final payment from cargo owner after delivery',
      metadata: {
        recipientNumber: '+254734567890',
        paymentMethod: 'credit_card'
      }
    });
    console.log('✅ Final payment for trip 2');
    
    // Final payment for another COMPLETED trip
    await createPayment(tenantId, trip4Id, cargoOwnerId, {
      amount: 8000,
      paymentType: 'final',
      status: 'completed',
      description: 'Final payment from cargo owner after delivery',
      metadata: {
        recipientNumber: '+254734567890',
        paymentMethod: 'credit_card'
      }
    });
    console.log('✅ Final payment for trip 4');
    
    console.log('');
    
    console.log('✅ All data seeded successfully!\n');
    console.log('📝 Login Credentials:');
    console.log('   Cargo Owner 1: cargo.owner@test.com / test123');
    console.log('   Cargo Owner 2: cargo.owner2@test.com / test123');
    console.log('   Truck Owner 1: truck.owner@test.com / test123');
    console.log('   Truck Owner 2: truck.owner2@test.com / test123');
    console.log('   Driver 1: driver1@test.com / test123');
    console.log('   Driver 2: driver2@test.com / test123');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the script
if (require.main === module) {
  seedAllData()
    .then(() => {
      console.log('\n✅ Seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedAllData };

