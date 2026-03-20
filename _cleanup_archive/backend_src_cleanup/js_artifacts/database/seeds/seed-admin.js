#!/usr/bin/env node

/**
 * 👑 SUPER_ADMIN USER SEEDER
 * 
 * This script creates SUPER_ADMIN users for the system.
 * 
 * Run with: npm run seed:admin
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

// Admin users to create
const adminUsers = [
  {
    email: 'admin@urutix.com',
    password: 'Test123!@#',
    firstName: 'System',
    lastName: 'Administrator',
    companyName: 'UrutiX',
    phone: '+254-700-000-001',
  },
  {
    email: 'superadmin@urutix.com',
    password: 'Admin123!',
    firstName: 'Super',
    lastName: 'Admin',
    companyName: 'UrutiX',
    phone: '+254-700-000-002',
  },
];

async function getOrCreateAdminTenant() {
  // Check if admin tenant exists
  const existing = await pool.query(
    'SELECT id FROM tenants WHERE subdomain = $1 OR name = $2',
    ['admin', 'Admin Global']
  );
  
  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }
  
  // Create admin tenant
  const tenantId = generateUUID();
  await pool.query(`
    INSERT INTO tenants (
      id, name, subdomain, type, status, description,
      "contactEmail", "contactPhone", "isActive", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
  `, [
    tenantId,
    'Admin Global',
    'admin',
    'ENTERPRISE',
    'ACTIVE',
    'Global admin tenant for system administrators',
    'admin@urutix.com',
    '+254-700-000-000',
    true
  ]);
  
  console.log('✅ Created Admin Global tenant');
  return tenantId;
}

async function getOrCreateAdminUser(adminData, tenantId) {
  // Check if user already exists
  const existing = await pool.query('SELECT id, email, role FROM users WHERE email = $1', [adminData.email]);
  
  if (existing.rows.length > 0) {
    const user = existing.rows[0];
    
    // Update to SUPER_ADMIN if not already
    if (user.role !== 'SUPER_ADMIN') {
      const passwordHash = await bcrypt.hash(adminData.password, 10);
      await pool.query(
        `UPDATE users 
         SET role = $1, "passwordHash" = $2, status = $3, "emailVerifiedAt" = NOW(), "updatedAt" = NOW()
         WHERE id = $4`,
        ['SUPER_ADMIN', passwordHash, 'ACTIVE', user.id]
      );
      console.log(`  ✅ Updated user ${adminData.email} to SUPER_ADMIN`);
    } else {
      // Update password if needed
      const passwordHash = await bcrypt.hash(adminData.password, 10);
      await pool.query(
        `UPDATE users 
         SET "passwordHash" = $1, "loginAttempts" = 0, "lockedUntil" = NULL, "updatedAt" = NOW()
         WHERE id = $2`,
        [passwordHash, user.id]
      );
      console.log(`  ℹ️  User ${adminData.email} already exists (SUPER_ADMIN), password updated`);
    }
    
    // Update or create profile
    const profileCheck = await pool.query('SELECT id FROM user_profiles WHERE "userId" = $1', [user.id]);
    if (profileCheck.rows.length > 0) {
      await pool.query(
        `UPDATE user_profiles 
         SET "firstName" = $1, "lastName" = $2, "companyName" = $3, "updatedAt" = NOW()
         WHERE "userId" = $4`,
        [adminData.firstName, adminData.lastName, adminData.companyName, user.id]
      );
    } else {
      const profileId = generateUUID();
      await pool.query(
        `INSERT INTO user_profiles (
          id, "userId", "tenantId", "firstName", "lastName", "companyName", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
        [profileId, user.id, tenantId, adminData.firstName, adminData.lastName, adminData.companyName]
      );
    }
    
    return user.id;
  }
  
  // Create new user
  const userId = generateUUID();
  const passwordHash = await bcrypt.hash(adminData.password, 10);
  
  await pool.query(`
    INSERT INTO users (
      id, email, phone, "passwordHash", role, status, "tenantId",
      "emailVerifiedAt", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), NOW())
  `, [
    userId,
    adminData.email,
    adminData.phone,
    passwordHash,
    'SUPER_ADMIN',
    'ACTIVE',
    tenantId
  ]);
  
  // Create profile
  const profileId = generateUUID();
  await pool.query(`
    INSERT INTO user_profiles (
      id, "userId", "tenantId", "firstName", "lastName", "companyName", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
  `, [profileId, userId, tenantId, adminData.firstName, adminData.lastName, adminData.companyName]);
  
  console.log(`  ✅ Created SUPER_ADMIN: ${adminData.email}`);
  return userId;
}

async function seedAdmin() {
  console.log('👑 Starting SUPER_ADMIN User Seeding...\n');
  
  try {
    // Test database connection
    console.log('📡 Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful!\n');
    
    // Get or create admin tenant
    console.log('🏢 Getting or creating admin tenant...');
    const tenantId = await getOrCreateAdminTenant();
    console.log(`✅ Using tenant: ${tenantId}\n`);
    
    // Create admin users
    console.log('👑 Creating SUPER_ADMIN users...\n');
    
    const createdUsers = [];
    for (const admin of adminUsers) {
      const userId = await getOrCreateAdminUser(admin, tenantId);
      createdUsers.push({
        email: admin.email,
        password: admin.password,
        userId: userId
      });
    }
    
    console.log(`\n✅ Total SUPER_ADMIN users processed: ${createdUsers.length}\n`);
    
    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ SUPER_ADMIN Seeding Finished Successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📊 Summary:');
    console.log(`   - SUPER_ADMIN Users: ${createdUsers.length}`);
    console.log(`   - Tenant: Admin Global\n`);
    console.log('🔑 Login Credentials:\n');
    
    createdUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email}`);
      console.log(`      Password: ${user.password}`);
      console.log(`      Role: SUPER_ADMIN\n`);
    });
    
    console.log('🎉 All SUPER_ADMIN users are ready to use!\n');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the script
if (require.main === module) {
  seedAdmin()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { seedAdmin };

