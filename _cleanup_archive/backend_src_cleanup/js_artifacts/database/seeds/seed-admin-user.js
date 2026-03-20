#!/usr/bin/env node

/**
 * 👑 ADMIN USER SEEDER
 * 
 * This script creates an admin user with:
 * - Email: urutixv@gmail.com
 * - Password: Admin123@
 * - Role: ADMIN
 * 
 * Run with: npm run seed:admin-user
 * Or: node src/database/seeds/seed-admin-user.js
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

// Admin user to create
const adminUser = {
  email: 'urutixv@gmail.com',
  password: 'Admin123@',
  firstName: 'Admin',
  lastName: 'User',
  companyName: 'UrutiX',
  phone: '+254-700-000-000',
  role: 'ADMIN', // Use ADMIN role
};

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
    adminUser.email,
    adminUser.phone,
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
    
    // Update to ADMIN if not already
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
    adminData.role,
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
  
  console.log(`  ✅ Created ${adminData.role}: ${adminData.email}`);
  return userId;
}

async function seedAdminUser() {
  console.log('👑 Starting Admin User Seeding...\n');
  
  try {
    // Test database connection
    console.log('📡 Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful!\n');
    
    // Get or create admin tenant
    console.log('🏢 Getting or creating admin tenant...');
    const tenantId = await getOrCreateAdminTenant();
    console.log(`✅ Using tenant: ${tenantId}\n`);
    
    // Create admin user
    console.log(`👑 Creating ${adminUser.role} user...\n`);
    
    const userId = await getOrCreateAdminUser(adminUser, tenantId);
    
    console.log(`\n✅ Admin user processed successfully!\n`);
    
    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Admin User Seeding Finished Successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📊 Summary:');
    console.log(`   - Email: ${adminUser.email}`);
    console.log(`   - Password: ${adminUser.password}`);
    console.log(`   - Role: ${adminUser.role}`);
    console.log(`   - Status: ACTIVE`);
    console.log(`   - Tenant: Admin Global\n`);
    console.log('🎉 Admin user is ready to use!\n');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the script
if (require.main === module) {
  seedAdminUser()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { seedAdminUser };

