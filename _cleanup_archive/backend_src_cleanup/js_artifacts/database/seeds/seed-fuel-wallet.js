#!/usr/bin/env node

/**
 * 🚀 FUEL WALLET SEEDER
 * 
 * This script populates the database with test data for the Fuel implementation:
 * - Fuel Wallets
 * - Fuel Wallet Transactions
 * - Fuel Budgets
 * - Driver Fuel Advances
 * 
 * Run with: node src/database/seeds/seed-fuel-wallet.js
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

async function seedFuelData() {
  console.log('🚀 Starting Fuel Wallet Database Seeding...\n');

  try {
    // Test database connection
    console.log('📡 Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful!\n');

    // 1. Get the target tenant (preferring the one admin@urutix.com belongs to)
    const adminUserResult = await pool.query('SELECT "tenantId" FROM users WHERE email = \'admin@urutix.com\' OR role = \'TENANT_ADMIN\' LIMIT 1');
    if (adminUserResult.rows.length === 0) throw new Error("No admin user found to identify tenant.");
    const tenantId = adminUserResult.rows[0].tenantId;
    console.log(`✅ Using tenant: ${tenantId}`);

    // 2. Get a driver from THIS tenant
    const driverResult = await pool.query('SELECT id, "firstName", "lastName" FROM drivers WHERE "tenantId" = $1 LIMIT 1', [tenantId]);
    if (driverResult.rows.length === 0) {
      // If no driver in this tenant, try any driver and we'll force update it or just fail
      const anyDriver = await pool.query('SELECT id, "firstName", "lastName", "tenantId" FROM drivers LIMIT 1');
      if (anyDriver.rows.length === 0) throw new Error("No drivers found at all.");
      console.log(`⚠️ No driver in tenant ${tenantId}, using driver from ${anyDriver.rows[0].tenantId}`);
      // For seeding purposes, let's just use what we find but ideally they should match
    }
    const driver = driverResult.rows[0] || (await pool.query('SELECT id, "firstName", "lastName" FROM drivers LIMIT 1')).rows[0];
    const driverId = driver.id;
    console.log(`✅ Using driver: ${driver.firstName} ${driver.lastName} (${driverId})`);

    // 3. Get an admin user from THIS tenant
    const adminResult = await pool.query('SELECT id FROM users WHERE "tenantId" = $1 AND (role = \'SUPER_ADMIN\' OR role = \'TENANT_ADMIN\') LIMIT 1', [tenantId]);
    const adminId = adminResult.rows[0]?.id || null;

    // 4. Get a truck from THIS tenant
    const truckResult = await pool.query('SELECT id, "plateNumber" FROM trucks WHERE "tenantId" = $1 LIMIT 1', [tenantId]);
    if (truckResult.rows.length === 0) {
      console.log('⚠️ No truck found in this tenant, fetching any truck...');
    }
    const truck = truckResult.rows[0] || (await pool.query('SELECT id, "plateNumber" FROM trucks LIMIT 1')).rows[0];
    const truckId = truck.id;
    console.log(`✅ Using truck: ${truck.plateNumber}`);

    // 5. Get a trip from THIS tenant
    const tripResult = await pool.query('SELECT id, "tripNumber" FROM trips WHERE "tenantId" = $1 LIMIT 1', [tenantId]);
    const tripId = tripResult.rows[0]?.id || null;
    if (tripId) {
      console.log(`✅ Using trip: ${tripResult.rows[0].tripNumber}`);
    } else {
      console.log('⚠️ No trip found in this tenant.');
    }

    // ----- CREATE TABLES IF THEY DON'T EXIST -----
    console.log('🏗️ Creating tables if they don\'t exist...');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS fuel_wallets (
        id UUID PRIMARY KEY,
        tenant_id UUID NOT NULL,
        driver_id UUID,
        truck_id UUID,
        balance NUMERIC(15,2) DEFAULT 0,
        total_credits NUMERIC(15,2) DEFAULT 0,
        total_debits NUMERIC(15,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'ACTIVE',
        notes TEXT,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_transaction_at TIMESTAMP WITH TIME ZONE
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS fuel_wallet_transactions (
        id UUID PRIMARY KEY,
        tenant_id UUID NOT NULL,
        wallet_id UUID REFERENCES fuel_wallets(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        amount NUMERIC(15,2) NOT NULL,
        fuel_log_id UUID,
        description VARCHAR(255),
        reference_id VARCHAR(100),
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS fuel_budgets (
        id UUID PRIMARY KEY,
        tenant_id UUID NOT NULL,
        trip_id UUID NOT NULL,
        truck_id UUID NOT NULL,
        budgeted_amount NUMERIC(15,2) NOT NULL,
        actual_amount NUMERIC(15,2) DEFAULT 0,
        variance NUMERIC(15,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'PLANNED',
        variance_percentage NUMERIC(5,2) DEFAULT 0,
        alert_threshold NUMERIC(5,2) DEFAULT 10,
        alert_triggered BOOLEAN DEFAULT false,
        notes TEXT,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS driver_fuel_advances (
        id UUID PRIMARY KEY,
        tenant_id UUID NOT NULL,
        driver_id UUID NOT NULL,
        trip_id UUID,
        advance_amount NUMERIC(15,2) NOT NULL,
        advance_date TIMESTAMP WITH TIME ZONE NOT NULL,
        status VARCHAR(50) DEFAULT 'PENDING',
        approved_by UUID,
        approved_at TIMESTAMP WITH TIME ZONE,
        reconciliation_date TIMESTAMP WITH TIME ZONE,
        reconciliation_amount NUMERIC(15,2),
        reconciliation_notes TEXT,
        rejection_reason TEXT,
        notes TEXT,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ Tables created/verified successfully!');

    // ----- SEED FUEL WALLETS -----
    console.log('\n💰 Seeding Fuel Wallet...');
    const walletId = generateUUID();
    const balance = 500.00;

    // Cleanup old wallet for this driver if it exists
    await pool.query('DELETE FROM fuel_wallets WHERE driver_id = $1', [driverId]);

    await pool.query(`
      INSERT INTO fuel_wallets (
        id, tenant_id, driver_id, truck_id, balance, total_credits, total_debits, status, notes, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
    `, [walletId, tenantId, driverId, truckId, balance, 1000.00, 500.00, 'ACTIVE', 'Seed fuel wallet']);

    console.log(`✅ Created Fuel Wallet for driver (Balance: $${balance})`);

    // ----- SEED FUEL WALLET TRANSACTIONS -----
    console.log('\n💸 Seeding Fuel Wallet Transactions...');
    const tx1Id = generateUUID();
    await pool.query(`
      INSERT INTO fuel_wallet_transactions (
        id, tenant_id, wallet_id, type, amount, description, reference_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() - INTERVAL '5 days')
    `, [tx1Id, tenantId, walletId, 'CREDIT', 1000.00, 'Initial load for driver', 'REF-SEED-1']);

    const tx2Id = generateUUID();
    await pool.query(`
      INSERT INTO fuel_wallet_transactions (
        id, tenant_id, wallet_id, type, amount, description, reference_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() - INTERVAL '2 days')
    `, [tx2Id, tenantId, walletId, 'DEBIT', 500.00, 'Purchase at Shell Gas Station', 'REF-SEED-2']);

    console.log(`✅ Created 2 Fuel Wallet Transactions`);

    // ----- SEED FUEL BUDGETS -----
    console.log('\n📊 Seeding Fuel Budgets...');
    const budgetId = generateUUID();
    await pool.query(`
      INSERT INTO fuel_budgets (
        id, tenant_id, trip_id, truck_id, budgeted_amount, actual_amount, variance, status, 
        variance_percentage, alert_threshold, alert_triggered, notes, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
    `, [
      budgetId, tenantId, tripId, truckId, 1500.00, 1800.00, 300.00, 'OVER_BUDGET',
      20.00, 10.00, true, 'Driver took a longer route causing budget overrun'
    ]);
    console.log(`✅ Created 1 Over-Budget record`);

    // ----- SEED DRIVER FUEL ADVANCES -----
    console.log('\n💵 Seeding Driver Fuel Advances...');
    const adv1Id = generateUUID();
    await pool.query(`
      INSERT INTO driver_fuel_advances (
        id, tenant_id, driver_id, trip_id, advance_amount, advance_date, status, notes, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7, NOW(), NOW())
    `, [adv1Id, tenantId, driverId, tripId, 250.00, 'PENDING', 'Need extra fuel for detour']);

    const adv2Id = generateUUID();
    await pool.query(`
      INSERT INTO driver_fuel_advances (
        id, tenant_id, driver_id, trip_id, advance_amount, advance_date, status, approved_by, approved_at, notes, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '1 day', $6, $7, NOW(), $8, NOW(), NOW())
    `, [adv2Id, tenantId, driverId, tripId, 400.00, 'APPROVED', adminId, 'Approved for long haul']);

    console.log(`✅ Created 2 Driver Fuel Advances (1 PENDING, 1 APPROVED)`);

    console.log('\n🎉 Fuel Database Seeding completed successfully!');
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
  } finally {
    // End the pool
    await pool.end();
    console.log('🔌 Database connection closed.');
  }
}

seedFuelData();
