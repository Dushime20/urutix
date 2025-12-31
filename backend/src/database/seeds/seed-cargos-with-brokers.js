#!/usr/bin/env node

/**
 * 🚛 CARGO WITH BROKER ASSIGNMENT SEEDER
 * 
 * This script creates cargo/loads and assigns them to brokers.
 * It demonstrates the broker assignment workflow and creates commission records.
 * 
 * Run with: node src/database/seeds/seed-cargos-with-brokers.js
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

// Sample cargo data with broker assignments
const cargoData = [
  {
    title: 'Electronics Shipment - Nairobi to Mombasa',
    description: 'High-value electronics shipment requiring careful handling',
    weight: 5000,
    volume: 25,
    cargoType: 'GENERAL',
    loadValue: 500000,
    currencyCode: 'KES',
    status: 'PUBLISHED',
    brokerEmail: 'broker1@test.com', // Will be assigned to this broker
    commissionRate: 5.5, // Custom commission rate
    pickupLocation: {
      name: 'Nairobi Warehouse',
      address: 'Industrial Area, Nairobi',
      city: 'Nairobi',
      state: 'Nairobi County',
      country: 'Kenya',
      latitude: -1.2921,
      longitude: 36.8219,
    },
    deliveryLocation: {
      name: 'Mombasa Port',
      address: 'Port of Mombasa, Mombasa',
      city: 'Mombasa',
      state: 'Mombasa County',
      country: 'Kenya',
      latitude: -4.0435,
      longitude: 39.6682,
    },
    pickupDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
    deliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
  },
  {
    title: 'Furniture Delivery - Kisumu to Eldoret',
    description: 'Office furniture requiring flatbed truck',
    weight: 3000,
    volume: 40,
    cargoType: 'GENERAL',
    loadValue: 250000,
    currencyCode: 'KES',
    status: 'ASSIGNED',
    brokerEmail: 'broker2@test.com',
    commissionRate: 6.0,
    pickupLocation: {
      name: 'Kisumu Furniture Store',
      address: 'Kisumu Central, Kisumu',
      city: 'Kisumu',
      state: 'Kisumu County',
      country: 'Kenya',
      latitude: -0.0917,
      longitude: 34.7680,
    },
    deliveryLocation: {
      name: 'Eldoret Business Park',
      address: 'Eldoret Town, Eldoret',
      city: 'Eldoret',
      state: 'Uasin Gishu County',
      country: 'Kenya',
      latitude: 0.5143,
      longitude: 35.2698,
    },
    pickupDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    deliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    title: 'Refrigerated Goods - Nakuru to Nairobi',
    description: 'Fresh produce requiring temperature-controlled transport',
    weight: 2000,
    volume: 15,
    cargoType: 'REFRIGERATED',
    loadValue: 300000,
    currencyCode: 'KES',
    status: 'PUBLISHED',
    brokerEmail: 'broker1@test.com',
    commissionRate: 5.0, // Use broker's default rate
    requiresRefrigeration: true,
    temperatureMin: 2,
    temperatureMax: 8,
    pickupLocation: {
      name: 'Nakuru Farm',
      address: 'Nakuru County, Nakuru',
      city: 'Nakuru',
      state: 'Nakuru County',
      country: 'Kenya',
      latitude: -0.3031,
      longitude: 36.0800,
    },
    deliveryLocation: {
      name: 'Nairobi Market',
      address: 'City Market, Nairobi',
      city: 'Nairobi',
      state: 'Nairobi County',
      country: 'Kenya',
      latitude: -1.2921,
      longitude: 36.8219,
    },
    pickupDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    deliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    title: 'Construction Materials - Thika to Machakos',
    description: 'Heavy construction materials including cement and steel',
    weight: 10000,
    volume: 50,
    cargoType: 'GENERAL',
    loadValue: 400000,
    currencyCode: 'KES',
    status: 'DRAFT',
    brokerEmail: 'broker3@test.com',
    commissionRate: 7.0,
    pickupLocation: {
      name: 'Thika Cement Factory',
      address: 'Thika Industrial Area, Thika',
      city: 'Thika',
      state: 'Kiambu County',
      country: 'Kenya',
      latitude: -1.0332,
      longitude: 37.0692,
    },
    deliveryLocation: {
      name: 'Machakos Construction Site',
      address: 'Machakos Town, Machakos',
      city: 'Machakos',
      state: 'Machakos County',
      country: 'Kenya',
      latitude: -1.5167,
      longitude: 37.2667,
    },
    pickupDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    deliveryDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    title: 'Textiles Export - Nairobi to Mombasa Port',
    description: 'Textile products for export, requires careful packaging',
    weight: 4000,
    volume: 30,
    cargoType: 'GENERAL',
    loadValue: 600000,
    currencyCode: 'KES',
    status: 'PUBLISHED',
    brokerEmail: 'broker2@test.com',
    commissionRate: 5.5,
    pickupLocation: {
      name: 'Nairobi Textile Factory',
      address: 'Industrial Area, Nairobi',
      city: 'Nairobi',
      state: 'Nairobi County',
      country: 'Kenya',
      latitude: -1.2921,
      longitude: 36.8219,
    },
    deliveryLocation: {
      name: 'Mombasa Port Terminal',
      address: 'Port of Mombasa, Mombasa',
      city: 'Mombasa',
      state: 'Mombasa County',
      country: 'Kenya',
      latitude: -4.0435,
      longitude: 39.6682,
    },
    pickupDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

async function getOrCreateTenant() {
  const existing = await pool.query('SELECT id FROM tenants WHERE "isActive" = true LIMIT 1');
  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }
  
  const tenantId = generateUUID();
  await pool.query(`
    INSERT INTO tenants (
      id, name, subdomain, type, status, "isActive",
      "contactEmail", "contactPhone", address, city, state, country,
      "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
  `, [
    tenantId,
    'Uruti-X Default',
    'default',
    'ENTERPRISE',
    'ACTIVE',
    true,
    'admin@uruti-x.com',
    '+254-700-000-000',
    'Tech Hub, Nairobi',
    'Nairobi',
    'Nairobi County',
    'Kenya',
  ]);
  
  return tenantId;
}

async function getOrCreateCargoOwner(tenantId) {
  const email = 'cargo.owner@test.com';
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  
  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }
  
  const userId = generateUUID();
  const passwordHash = await bcrypt.hash('test123', 10);
  
  await pool.query(`
    INSERT INTO users (
      id, "tenantId", email, phone, "passwordHash", role, status,
      "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
  `, [
    userId,
    tenantId,
    email,
    '+254712345000',
    passwordHash,
    'CARGO_OWNER',
    'ACTIVE',
  ]);
  
  // Create profile
  await pool.query(`
    INSERT INTO user_profiles (
      id, "userId", "firstName", "lastName", "createdAt", "updatedAt"
    ) VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW())
  `, [userId, 'Cargo', 'Owner']);
  
  console.log(`  ✅ Created cargo owner: ${email}`);
  return userId;
}

async function getBrokerByEmail(email, tenantId) {
  const result = await pool.query(`
    SELECT id, "defaultCommissionRate" 
    FROM users 
    WHERE email = $1 AND "tenantId" = $2 AND role = 'BROKER'
  `, [email, tenantId]);
  
  if (result.rows.length === 0) {
    throw new Error(`Broker with email ${email} not found. Please run seed-brokers.js first.`);
  }
  
  return result.rows[0];
}

// Note: Loads table uses a 'locations' JSONB column, not separate location IDs
// We'll create the locations array directly in the load creation

async function createCargoWithBroker(cargo, tenantId, cargoOwnerId) {
  const loadId = generateUUID();
  
  // Get broker
  const broker = await getBrokerByEmail(cargo.brokerEmail, tenantId);
  const brokerId = broker.id;
  
  // Use provided commission rate or broker's default
  const commissionRate = cargo.commissionRate || broker.defaultCommissionRate || 5.0;
  const commissionAmount = (cargo.loadValue * commissionRate) / 100;
  
  // Create locations array in JSONB format (LoadLocation[])
  const locationsArray = [
    {
      id: generateUUID(),
      type: 'PICKUP',
      sequence: 1,
      locationData: {
        name: cargo.pickupLocation.name,
        address: cargo.pickupLocation.address,
        city: cargo.pickupLocation.city,
        state: cargo.pickupLocation.state,
        country: cargo.pickupLocation.country,
        coordinates: {
          latitude: cargo.pickupLocation.latitude,
          longitude: cargo.pickupLocation.longitude,
        },
      },
      scheduledDate: cargo.pickupDate,
      estimatedTime: 60, // 60 minutes default
      status: 'PENDING',
    },
    {
      id: generateUUID(),
      type: 'DELIVERY',
      sequence: 2,
      locationData: {
        name: cargo.deliveryLocation.name,
        address: cargo.deliveryLocation.address,
        city: cargo.deliveryLocation.city,
        state: cargo.deliveryLocation.state,
        country: cargo.deliveryLocation.country,
        coordinates: {
          latitude: cargo.deliveryLocation.latitude,
          longitude: cargo.deliveryLocation.longitude,
        },
      },
      scheduledDate: cargo.deliveryDate,
      estimatedTime: 60, // 60 minutes default
      status: 'PENDING',
    },
  ];
  
  // Create origin and destination objects
  const origin = {
    address: cargo.pickupLocation.address,
    city: cargo.pickupLocation.city,
    state: cargo.pickupLocation.state,
    country: cargo.pickupLocation.country,
    coordinates: {
      latitude: cargo.pickupLocation.latitude,
      longitude: cargo.pickupLocation.longitude,
    },
  };
  
  const destination = {
    address: cargo.deliveryLocation.address,
    city: cargo.deliveryLocation.city,
    state: cargo.deliveryLocation.state,
    country: cargo.deliveryLocation.country,
    coordinates: {
      latitude: cargo.deliveryLocation.latitude,
      longitude: cargo.deliveryLocation.longitude,
    },
  };
  
  // Create load
  await pool.query(`
    INSERT INTO loads (
      id, "tenantId", "cargoOwnerId", "brokerId",
      title, description, weight, volume, "cargoType",
      "loadValue", "currencyCode", status,
      "brokerCommissionRate", "brokerCommissionAmount",
      "pickupDate", "deliveryDate",
      "requiresRefrigeration", "temperatureMin", "temperatureMax",
      locations, origin, destination,
      "loadType", "equipmentType", "visibility",
      "createdAt", "updatedAt"
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
      $13, $14, $15, $16, $17, $18, $19, $20::jsonb, $21::jsonb, $22::jsonb,
      $23, $24, $25, NOW(), NOW()
    )
  `, [
    loadId,
    tenantId,
    cargoOwnerId,
    brokerId,
    cargo.title,
    cargo.description,
    cargo.weight,
    cargo.volume,
    cargo.cargoType,
    cargo.loadValue,
    cargo.currencyCode,
    cargo.status,
    commissionRate,
    commissionAmount,
    cargo.pickupDate,
    cargo.deliveryDate,
    cargo.requiresRefrigeration || false,
    cargo.temperatureMin || null,
    cargo.temperatureMax || null,
    JSON.stringify(locationsArray),
    JSON.stringify(origin),
    JSON.stringify(destination),
    'FTL', // LoadType
    'DRY_VAN', // EquipmentType
    'public', // Visibility (lowercase)
  ]);
  
  // Create commission record
  const commissionId = generateUUID();
  await pool.query(`
    INSERT INTO broker_commissions (
      id, "tenantId", "brokerId", "loadId",
      "loadAmount", "commissionRate", "commissionAmount",
      status, "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
  `, [
    commissionId,
    tenantId,
    brokerId,
    loadId,
    cargo.loadValue,
    commissionRate,
    commissionAmount,
    cargo.status === 'ASSIGNED' ? 'APPROVED' : 'PENDING',
  ]);
  
  return {
    loadId,
    brokerId,
    commissionId,
    commissionRate,
    commissionAmount,
  };
}

async function seedCargosWithBrokers() {
  console.log('🚛 Starting Cargo with Broker Assignment Seeding...\n');
  
  try {
    // Test database connection
    console.log('📡 Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful!\n');
    
    // Get or create tenant
    console.log('🏢 Getting tenant...');
    const tenantId = await getOrCreateTenant();
    console.log(`✅ Using tenant: ${tenantId}\n`);
    
    // Get or create cargo owner
    console.log('👤 Getting cargo owner...');
    const cargoOwnerId = await getOrCreateCargoOwner(tenantId);
    console.log(`✅ Using cargo owner: ${cargoOwnerId}\n`);
    
    // Verify brokers exist
    console.log('🏪 Verifying brokers exist...');
    const brokerEmails = [...new Set(cargoData.map(c => c.brokerEmail))];
    for (const email of brokerEmails) {
      const broker = await getBrokerByEmail(email, tenantId);
      console.log(`✅ Found broker: ${email} (Default rate: ${broker.defaultCommissionRate}%)`);
    }
    console.log('');
    
    // Create cargos with broker assignments
    console.log('📦 Creating cargos with broker assignments...\n');
    const results = [];
    
    for (const cargo of cargoData) {
      try {
        const result = await createCargoWithBroker(cargo, tenantId, cargoOwnerId);
        results.push(result);
        
        console.log(`✅ Created cargo: "${cargo.title}"`);
        console.log(`   - Load ID: ${result.loadId}`);
        console.log(`   - Assigned to broker: ${cargo.brokerEmail}`);
        console.log(`   - Commission Rate: ${result.commissionRate}%`);
        console.log(`   - Commission Amount: ${cargo.currencyCode} ${result.commissionAmount.toLocaleString()}`);
        console.log(`   - Status: ${cargo.status}`);
        console.log('');
      } catch (error) {
        console.error(`❌ Failed to create cargo "${cargo.title}":`, error.message);
        console.log('');
      }
    }
    
    // Summary
    console.log('📊 Seeding Summary:');
    console.log(`   ✅ Created ${results.length} cargos`);
    console.log(`   ✅ Assigned to ${brokerEmails.length} different brokers`);
    console.log(`   ✅ Created ${results.length} commission records`);
    console.log('');
    
    console.log('🎉 Cargo with Broker Assignment Seeding Complete!\n');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the seeder
if (require.main === module) {
  seedCargosWithBrokers()
    .then(() => {
      console.log('✅ Seeding process completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding process failed:', error);
      process.exit(1);
    });
}

module.exports = { seedCargosWithBrokers };

