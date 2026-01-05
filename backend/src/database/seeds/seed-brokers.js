#!/usr/bin/env node

/**
 * 🏪 BROKER DATABASE SEEDER
 * 
 * This script seeds the database with broker data including:
 * - Multiple brokers with different commission rates
 * - Broker user accounts with profiles
 * - Sample broker commissions (optional)
 * 
 * Run with: node src/database/seeds/seed-brokers.js
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

// Broker data
const brokers = [
  {
    email: 'broker1@test.com',
    phone: '+254712345001',
    firstName: 'John',
    lastName: 'Broker',
    companyName: 'Premium Logistics Brokers',
    defaultCommissionRate: 5.0,
    description: 'Experienced broker specializing in long-distance freight',
  },
  {
    email: 'broker2@test.com',
    phone: '+254712345002',
    firstName: 'Sarah',
    lastName: 'Mwangi',
    companyName: 'East Africa Freight Brokers',
    defaultCommissionRate: 7.5,
    description: 'Regional broker with extensive network across East Africa',
  },
  {
    email: 'broker3@test.com',
    phone: '+254712345003',
    firstName: 'David',
    lastName: 'Kamau',
    companyName: 'Express Cargo Solutions',
    defaultCommissionRate: 4.5,
    description: 'Fast and reliable broker for time-sensitive shipments',
  },
  {
    email: 'broker4@test.com',
    phone: '+254712345004',
    firstName: 'Grace',
    lastName: 'Njeri',
    companyName: 'Agricultural Transport Brokers',
    defaultCommissionRate: 6.0,
    description: 'Specialized in agricultural product transportation',
  },
  {
    email: 'broker5@test.com',
    phone: '+254712345005',
    firstName: 'Peter',
    lastName: 'Ochieng',
    companyName: 'International Freight Brokers',
    defaultCommissionRate: 8.0,
    description: 'Cross-border freight and logistics broker',
  },
  {
    email: 'broker6@test.com',
    phone: '+254712345006',
    firstName: 'Mary',
    lastName: 'Wanjiku',
    companyName: 'Urban Delivery Brokers',
    defaultCommissionRate: 3.5,
    description: 'City and urban area delivery specialist',
  },
];

async function getOrCreateTenant() {
  // Get the first active tenant or create a default one
  const existing = await pool.query(
    'SELECT id FROM tenants WHERE "isActive" = true ORDER BY "createdAt" ASC LIMIT 1'
  );
  
  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }
  
  // Create default tenant if none exists
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
  
  console.log(`  ✅ Created default tenant: ${tenantId}`);
  return tenantId;
}

async function getOrCreateBroker(broker, tenantId) {
  // Check if broker already exists
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [broker.email]);
  
  if (existing.rows.length > 0) {
    const userId = existing.rows[0].id;
    // Update broker-specific fields if they exist
    await pool.query(`
      UPDATE users 
      SET 
        "brokerTenantId" = $1,
        "defaultCommissionRate" = $2,
        "updatedAt" = NOW()
      WHERE id = $3
    `, [tenantId, broker.defaultCommissionRate, userId]);
    
    console.log(`    ℹ️  Broker ${broker.email} already exists, updated broker fields...`);
    return userId;
  }
  
  const userId = generateUUID();
  const passwordHash = await bcrypt.hash('test123', 10);
  
  // Create user with broker role
  await pool.query(`
    INSERT INTO users (
      id, email, phone, "passwordHash", role, status, "tenantId",
      "brokerTenantId", "defaultCommissionRate", "totalCommissionEarned",
      "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
  `, [
    userId,
    broker.email,
    broker.phone,
    passwordHash,
    'BROKER',
    'ACTIVE',
    tenantId,
    tenantId, // brokerTenantId
    broker.defaultCommissionRate,
    0, // totalCommissionEarned
  ]);
  
  // Create profile
  const profileId = generateUUID();
  await pool.query(`
    INSERT INTO user_profiles (
      id, "userId", "tenantId", "firstName", "lastName", "companyName",
      "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
  `, [profileId, userId, tenantId, broker.firstName, broker.lastName, broker.companyName]);
  
  console.log(`    ✅ Created broker: ${broker.firstName} ${broker.lastName} (${broker.email}) - Rate: ${broker.defaultCommissionRate}%`);
  return userId;
}

async function seedBrokers() {
  console.log('🏪 Starting Broker Database Seeding...\n');
  
  try {
    // Test database connection
    console.log('📡 Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful!\n');
    
    // Get or create tenant
    console.log('🏢 Getting or creating tenant...');
    const tenantId = await getOrCreateTenant();
    console.log(`✅ Using tenant: ${tenantId}\n`);
    
    // Step 1: Create Brokers
    console.log('👥 Creating brokers...\n');
    
    const brokerIds = [];
    let brokerCount = 0;
    
    for (const broker of brokers) {
      const brokerId = await getOrCreateBroker(broker, tenantId);
      brokerIds.push(brokerId);
      brokerCount++;
    }
    
    console.log(`\n✅ Total brokers processed: ${brokerCount}\n`);
    
    // Step 2: Create an additional broker
    console.log('👥 Creating additional broker...\n');
    
    const additionalBroker = {
      email: 'broker7@test.com',
      phone: '+254712345007',
      firstName: 'James',
      lastName: 'Additional',
      companyName: 'Additional Broker Services',
      defaultCommissionRate: 4.0,
      description: 'Additional broker for testing',
    };
    
    const additionalBrokerId = await getOrCreateBroker(additionalBroker, tenantId);
    brokerIds.push(additionalBrokerId);
    brokerCount++;
    console.log(`✅ Created additional broker: ${additionalBroker.email}\n`);
    
    // Step 3: Verify broker data
    console.log('🔍 Verifying broker data...\n');
    
    const verification = await pool.query(`
      SELECT 
        u.id,
        u.email,
        u.role,
        u."defaultCommissionRate",
        u."totalCommissionEarned",
        up."firstName",
        up."lastName",
        up."companyName"
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up."userId"
      WHERE u.role = 'BROKER' AND u."tenantId" = $1
      ORDER BY u."createdAt" ASC
    `, [tenantId]);
    
    console.log(`📊 Found ${verification.rows.length} brokers in database:\n`);
    verification.rows.forEach((broker, index) => {
      console.log(`  ${index + 1}. ${broker.firstName} ${broker.lastName}`);
      console.log(`     Email: ${broker.email}`);
      console.log(`     Company: ${broker.companyName || 'N/A'}`);
      console.log(`     Commission Rate: ${broker.defaultCommissionRate}%`);
      console.log(`     Total Earned: ${broker.totalCommissionEarned || 0}`);
      console.log('');
    });
    
    // Summary
    console.log('\n✅ Broker seeding finished successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Brokers created: ${brokerCount}`);
    console.log(`   - Tenant ID: ${tenantId}`);
    console.log('\n🔑 All brokers have password: test123');
    console.log('\n💡 Broker Features:');
    console.log('   - Each broker has a default commission rate');
    console.log('   - Brokers can be assigned to loads');
    console.log('   - Commissions are calculated automatically');
    console.log('\n🎉 All broker data seeded successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the script
if (require.main === module) {
  seedBrokers()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { seedBrokers };

