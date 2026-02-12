#!/usr/bin/env node

/**
 * 🏢 TENANT ADMIN USER SEEDER
 * 
 * This script creates a tenant admin user with:
 * - Email: tenant.admin@test.com
 * - Password: Admin123@
 * - Role: TENANT_ADMIN
 * 
 * Run with: node seed-tenant-admin.js
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

// Tenant Admin user to create
const tenantAdminUser = {
  email: 'tenant.admin@test.com',
  password: 'Admin123@',
  firstName: 'Tenant',
  lastName: 'Administrator',
  companyName: 'UrutiX Management',
  phone: '+254-700-111-111',
  role: 'TENANT_ADMIN',
};

async function getDefaultTenant() {
  // Get the default tenant (Uruti-X Default)
  const result = await pool.query(
    'SELECT id FROM tenants WHERE "isActive" = true ORDER BY "createdAt" ASC LIMIT 1'
  );
  
  if (result.rows.length > 0) {
    return result.rows[0].id;
  }
  
  throw new Error('No active tenant found. Please run seed-complete-system.js first.');
}

async function createTenantAdmin(adminData, tenantId) {
  // Check if user already exists
  const existing = await pool.query('SELECT id, email, role FROM users WHERE email = $1', [adminData.email]);
  
  if (existing.rows.length > 0) {
    const user = existing.rows[0];
    
    // Update to TENANT_ADMIN if not already
    if (user.role !== adminData.role) {
      const passwordHash = await bcrypt.hash(adminData.password, 10);
      await pool.query(
        `UPDATE users 
         SET role = $1, "passwordHash" = $2, status = $3, "emailVerifiedAt" = NOW(), "updatedAt" = NOW()
         WHERE id = $4`,
        [adminData.role, passwordHash, 'ACTIVE', user.id]
      );
      console.log(`  ✅ Updated user ${adminData.email} to ${adminData.role}`);
    } else {
      // Update password
      const passwordHash = await bcrypt.hash(adminData.password, 10);
      await pool.query(
        `UPDATE users 
         SET "passwordHash" = $1, "loginAttempts" = 0, "lockedUntil" = NULL, "updatedAt" = NOW()
         WHERE id = $2`,
        [passwordHash, user.id]
      );
      console.log(`  ℹ️  User ${adminData.email} already exists (${adminData.role}), password updated`);
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
      const profileId = uuidv4();
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
  const userId = uuidv4();
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
    adminData.role,
    'ACTIVE',
    tenantId
  ]);
  
  // Create profile
  const profileId = uuidv4();
  await pool.query(`
    INSERT INTO user_profiles (
      id, "userId", "tenantId", "firstName", "lastName", "companyName", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
  `, [profileId, userId, tenantId, adminData.firstName, adminData.lastName, adminData.companyName]);
  
  console.log(`  ✅ Created ${adminData.role}: ${adminData.email}`);
  return userId;
}

async function seedTenantAdmin() {
  console.log('🏢 Starting Tenant Admin User Seeding...\n');
  
  try {
    // Test database connection
    console.log('📡 Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful!\n');
    
    // Get default tenant
    console.log('🏢 Getting default tenant...');
    const tenantId = await getDefaultTenant();
    console.log(`✅ Using tenant: ${tenantId}\n`);
    
    // Create tenant admin user
    console.log(`🏢 Creating ${tenantAdminUser.role} user...\n`);
    
    const userId = await createTenantAdmin(tenantAdminUser, tenantId);
    
    console.log(`\n✅ Tenant admin user processed successfully!\n`);
    
    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Tenant Admin User Seeding Finished Successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📊 Summary:');
    console.log(`   - Email: ${tenantAdminUser.email}`);
    console.log(`   - Password: ${tenantAdminUser.password}`);
    console.log(`   - Role: ${tenantAdminUser.role}`);
    console.log(`   - Status: ACTIVE`);
    console.log(`   - Tenant: Uruti-X Default\n`);
    console.log('🎉 Tenant admin user is ready to use!\n');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the script
if (require.main === module) {
  seedTenantAdmin()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { seedTenantAdmin };
