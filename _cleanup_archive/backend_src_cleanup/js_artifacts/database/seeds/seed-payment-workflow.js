#!/usr/bin/env node

/**
 * 💰 PAYMENT WORKFLOW SEEDER
 * 
 * This script creates comprehensive payment workflow data:
 * - Trips with different statuses (PLANNED, IN_PROGRESS, COMPLETED)
 * - Payments with different statuses (pending, processing, completed, overdue)
 * - Advance and final payments
 * - Payments with different due dates (past, present, future)
 * 
 * Run with: node src/database/seeds/seed-payment-workflow.js
 */

const { Pool } = require('pg');
require('dotenv').config();
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

// Helper function to get or create tenant
async function getOrCreateTenant() {
  const result = await pool.query(
    'SELECT id FROM tenants WHERE "isActive" = true LIMIT 1'
  );
  
  if (result.rows.length > 0) {
    return result.rows[0].id;
  }
  
  const tenantId = generateUUID();
  await pool.query(`
    INSERT INTO tenants (id, name, "isActive")
    VALUES ($1, $2, $3)
  `, [tenantId, 'Default Tenant', true]);
  
  return tenantId;
}

// Helper function to get user by email
async function getUserByEmail(email) {
  const result = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  return result.rows.length > 0 ? result.rows[0].id : null;
}

// Helper function to get or create location
async function getOrCreateLocation(tenantId, name, city, country, lat, lng) {
  const existing = await pool.query(
    'SELECT id FROM locations WHERE name = $1 AND "tenantId" = $2',
    [name, tenantId]
  );
  
  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }
  
  const locationId = generateUUID();
  // Use PostGIS Point format for coordinates: ST_SetSRID(ST_MakePoint(lng, lat), 4326)
  // Note: The actual database schema doesn't have city/country columns, so we store them in address
  await pool.query(`
    INSERT INTO locations (
      id, "tenantId", name, address, coordinates, "locationType", "isActive"
    ) VALUES ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($5, $6), 4326), $7, $8)
  `, [
    locationId, 
    tenantId, 
    name, 
    `${name}, ${city}, ${country}`, // address (required) - includes city and country info
    lng, // longitude first for PostGIS
    lat, // latitude second for PostGIS
    'GENERAL', // locationType
    true // isActive
  ]);
  
  return locationId;
}

// Helper function to get or create truck
async function getOrCreateTruck(tenantId, ownerId, truckNumber) {
  const plateNumber = `PLT-${truckNumber}`;
  const existing = await pool.query(
    'SELECT id FROM trucks WHERE "plateNumber" = $1 AND "tenantId" = $2',
    [plateNumber, tenantId]
  );
  
  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }
  
  const truckId = generateUUID();
  const vin = `VIN${truckNumber.padStart(14, '0')}`; // Generate a VIN-like string
  const now = new Date();
  const regExpiry = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
  const insExpiry = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
  
  await pool.query(`
    INSERT INTO trucks (
      id, "tenantId", "ownerId", "plateNumber", "vin", "make", "model", "year",
      "capacityWeight", "capacityVolume", "registrationNumber", "registrationExpiry",
      "insurancePolicy", "insuranceExpiry", "status"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
  `, [
    truckId, tenantId, ownerId, plateNumber, vin,
    'Mercedes', 'Actros', 2020,
    20000, // capacityWeight (kg)
    50, // capacityVolume (m³)
    `REG-${truckNumber}`, // registrationNumber
    regExpiry, // registrationExpiry
    `INS-${truckNumber}`, // insurancePolicy
    insExpiry, // insuranceExpiry
    'AVAILABLE' // status (VehicleStatus enum)
  ]);
  
  return truckId;
}

// Helper function to get or create driver
async function getOrCreateDriver(tenantId, userId, employerId) {
  const existing = await pool.query(
    'SELECT id FROM drivers WHERE "userId" = $1 AND "tenantId" = $2',
    [userId, tenantId]
  );
  
  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }
  
  const driverId = generateUUID();
  const licenseNumber = `DL-${userId.substring(0, 8)}`;
  const now = new Date();
  const dob = new Date(now.getFullYear() - 30, 0, 1); // 30 years old
  const licenseIssue = new Date(now.getFullYear() - 5, 0, 1);
  const licenseExpiry = new Date(now.getFullYear() + 2, 0, 1);
  const hireDate = new Date(now.getFullYear() - 2, 0, 1); // Hired 2 years ago
  
  await pool.query(`
    INSERT INTO drivers (
      id, "tenantId", "userId", "employerId", "firstName", "lastName", "email", "phone",
      "dateOfBirth", "address", "licenseNumber", "licenseIssueDate", "licenseExpiry",
      "licenseState", "licenseCountry", "hireDate", "status"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
  `, [
    driverId, tenantId, userId, employerId,
    'John', 'Driver', 'driver@test.com', '+1234567890',
    dob, '123 Driver St, City, Country',
    licenseNumber, licenseIssue, licenseExpiry,
    'State', 'Country', hireDate, 'ACTIVE'
  ]);
  
  return driverId;
}

// Helper function to create load
async function createLoad(tenantId, cargoOwnerId, title, originId, destinationId) {
  const loadId = generateUUID();
  const locations = JSON.stringify([originId, destinationId]);
  await pool.query(`
    INSERT INTO loads (
      id, "tenantId", "cargoOwnerId", title, description, locations,
      weight, "cargoType", status, "loadValue", "offeredPrice", "currencyCode"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
  `, [
    loadId, tenantId, cargoOwnerId, title,
    `Cargo shipment: ${title}`, locations,
    15000, 'GENERAL', 'PUBLISHED', 50000, 45000, 'USD'
  ]);
  
  return loadId;
}

// Helper function to create trip
async function createTrip(tenantId, loadId, truckId, driverId, tripNumber, status, agreedPrice, currencyCode) {
  const tripId = generateUUID();
  const now = new Date();
  const startTime = new Date(now.getTime() + (status === 'PLANNED' ? 2 * 24 * 60 * 60 * 1000 : -1 * 24 * 60 * 60 * 1000));
  const endTime = new Date(startTime.getTime() + 3 * 24 * 60 * 60 * 1000);
  
  await pool.query(`
    INSERT INTO trips (
      id, "tenantId", "loadId", "truckId", "driverId", "tripNumber", status,
      "plannedStartTime", "plannedEndTime", "agreedPrice", "currencyCode",
      "totalDistance"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
  `, [
    tripId, tenantId, loadId, truckId, driverId, tripNumber, status,
    startTime, endTime, agreedPrice, currencyCode, 500
  ]);
  
  return tripId;
}

// Helper function to create payment
async function createPayment(
  tenantId,
  tripId,
  payerId,
  amount,
  currency,
  paymentType,
  status,
  dueDate,
  processedAt = null
) {
  const paymentId = generateUUID();
  const referenceNumber = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Normalize payment type to match enum values
  let normalizedPaymentType = paymentType;
  if (paymentType === 'trip_payment') {
    normalizedPaymentType = 'trip_payment';
  } else if (paymentType === 'advance') {
    normalizedPaymentType = 'advance';
  } else if (paymentType === 'final') {
    normalizedPaymentType = 'final';
  }
  
  await pool.query(`
    INSERT INTO payments (
      id, "tenantId", "tripId", "payerId", amount, currency, "paymentMethod",
      "paymentType", status, "dueDate", "processedAt", "referenceNumber",
      description
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
  `, [
    paymentId, tenantId, tripId, payerId, amount, currency, 'credit_card',
    normalizedPaymentType, status, dueDate, processedAt, referenceNumber,
    `${paymentType} payment for trip`
  ]);
  
  return paymentId;
}

// Main seeding function
async function seedPaymentWorkflow() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting payment workflow seed...\n');
    
    // Get tenant
    const tenantId = await getOrCreateTenant();
    console.log(`✅ Using tenant: ${tenantId}\n`);
    
    // Get users
    const cargoOwnerId = await getUserByEmail('cargo.owner@test.com');
    const truckOwnerId = await getUserByEmail('truck.owner@test.com');
    const driverUserId = await getUserByEmail('driver@test.com');
    
    if (!cargoOwnerId || !truckOwnerId || !driverUserId) {
      console.error('❌ Required users not found. Please run user seed first.');
      console.error('   Required users: cargo.owner@test.com, truck.owner@test.com, driver@test.com');
      return;
    }
    
    console.log('✅ Found required users\n');
    
    // Create locations
    const originId = await getOrCreateLocation(tenantId, 'Nairobi Warehouse', 'Nairobi', 'Kenya', -1.2921, 36.8219);
    const destinationId = await getOrCreateLocation(tenantId, 'Mombasa Port', 'Mombasa', 'Kenya', -4.0435, 39.6682);
    console.log('✅ Created locations\n');
    
    // Create truck and driver
    const truckId = await getOrCreateTruck(tenantId, truckOwnerId, 'TRUCK-001');
    const driverId = await getOrCreateDriver(tenantId, driverUserId, truckOwnerId);
    console.log('✅ Created truck and driver\n');
    
    // Create trips and payments with different scenarios
    const now = new Date();
    const scenarios = [
      {
        tripNumber: 'TRIP-2024-001',
        status: 'PLANNED',
        agreedPrice: 5000,
        currencyCode: 'USD',
        payments: [
          {
            type: 'advance',
            amount: 5000,
            status: 'pending',
            dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          },
        ],
      },
      {
        tripNumber: 'TRIP-2024-002',
        status: 'IN_PROGRESS',
        agreedPrice: 7500,
        currencyCode: 'USD',
        payments: [
          {
            type: 'advance',
            amount: 3500, // 70% advance
            status: 'processing',
            dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
          },
          {
            type: 'final',
            amount: 4000, // 30% final
            status: 'pending',
            dueDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
          },
        ],
      },
      {
        tripNumber: 'TRIP-2024-003',
        status: 'COMPLETED',
        agreedPrice: 6000,
        currencyCode: 'USD',
        payments: [
          {
            type: 'advance',
            amount: 4200,
            status: 'completed',
            dueDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
            processedAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
          },
          {
            type: 'final',
            amount: 1800,
            status: 'completed',
            dueDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
            processedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
          },
        ],
      },
      {
        tripNumber: 'TRIP-2024-004',
        status: 'IN_PROGRESS',
        agreedPrice: 8000,
        currencyCode: 'USD',
        payments: [
          {
            type: 'trip_payment',
            amount: 8000,
            status: 'pending',
            dueDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago (OVERDUE)
          },
        ],
      },
      {
        tripNumber: 'TRIP-2024-005',
        status: 'PLANNED',
        agreedPrice: 4500,
        currencyCode: 'USD',
        payments: [
          {
            type: 'trip_payment',
            amount: 4500,
            status: 'pending',
            dueDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
          },
        ],
      },
      {
        tripNumber: 'TRIP-2024-006',
        status: 'IN_PROGRESS',
        agreedPrice: 9000,
        currencyCode: 'USD',
        payments: [
          {
            type: 'advance',
            amount: 6300,
            status: 'completed',
            dueDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
            processedAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
          },
          {
            type: 'final',
            amount: 2700,
            status: 'processing',
            dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
          },
        ],
      },
      {
        tripNumber: 'TRIP-2024-007',
        status: 'PLANNED',
        agreedPrice: 5500,
        currencyCode: 'USD',
        payments: [
          {
            type: 'trip_payment',
            amount: 5500,
            status: 'pending',
            dueDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), // 1 day from now (UPCOMING)
          },
        ],
      },
      {
        tripNumber: 'TRIP-2024-008',
        status: 'COMPLETED',
        agreedPrice: 7000,
        currencyCode: 'USD',
        payments: [
          {
            type: 'advance',
            amount: 4900,
            status: 'completed',
            dueDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
            processedAt: new Date(now.getTime() - 19 * 24 * 60 * 60 * 1000), // 19 days ago
          },
          {
            type: 'final',
            amount: 2100,
            status: 'completed',
            dueDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
            processedAt: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000), // 9 days ago
          },
        ],
      },
    ];
    
    console.log('📦 Creating trips and payments...\n');
    
    for (const scenario of scenarios) {
      // Create load
      const loadId = await createLoad(
        tenantId,
        cargoOwnerId,
        `Cargo for ${scenario.tripNumber}`,
        originId,
        destinationId
      );
      
      // Check if trip already exists
      const existingTrip = await pool.query(
        'SELECT id FROM trips WHERE "tripNumber" = $1 AND "tenantId" = $2',
        [scenario.tripNumber, tenantId]
      );
      
      let tripId;
      if (existingTrip.rows.length > 0) {
        tripId = existingTrip.rows[0].id;
        console.log(`⏭️  Trip already exists: ${scenario.tripNumber}, using existing trip`);
      } else {
        // Create trip
        tripId = await createTrip(
          tenantId,
          loadId,
          truckId,
          driverId,
          scenario.tripNumber,
          scenario.status,
          scenario.agreedPrice,
          scenario.currencyCode
        );
        console.log(`✅ Created trip: ${scenario.tripNumber} (${scenario.status})`);
      }
      
      // Create payments for this trip
      for (const paymentData of scenario.payments) {
        await createPayment(
          tenantId,
          tripId,
          cargoOwnerId,
          paymentData.amount,
          scenario.currencyCode,
          paymentData.type,
          paymentData.status,
          paymentData.dueDate,
          paymentData.processedAt || null
        );
        
        console.log(`   💰 Created ${paymentData.type} payment: ${paymentData.amount} ${scenario.currencyCode} (${paymentData.status})`);
      }
      
      console.log('');
    }
    
    console.log('✅ Payment workflow seed completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - Created ${scenarios.length} trips`);
    console.log(`   - Created ${scenarios.reduce((sum, s) => sum + s.payments.length, 0)} payments`);
    console.log(`   - Payment statuses: pending, processing, completed, overdue`);
    console.log(`   - Payment types: advance, final, trip_payment`);
    console.log('\n🎉 You can now test the payment workflow in the dashboard!');
    
  } catch (error) {
    console.error('❌ Error seeding payment workflow:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the seed
if (require.main === module) {
  seedPaymentWorkflow()
    .then(() => {
      console.log('\n✅ Seed completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Seed failed:', error);
      process.exit(1);
    });
}

module.exports = { seedPaymentWorkflow };


