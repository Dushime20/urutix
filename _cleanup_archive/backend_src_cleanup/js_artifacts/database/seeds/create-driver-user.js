#!/usr/bin/env node

/**
 * 🚛 CREATE DRIVER USER SCRIPT
 * 
 * This script creates a Driver user for testing purposes
 */

const { Pool } = require('pg');
require('dotenv').config();

// Database configuration - align with your backend config
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  database: process.env.DB_DATABASE || 'urutix',
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '123',
};

async function createDriverUser() {
  console.log('🚛 Creating Driver User...\n');
  
  const pool = new Pool(dbConfig);
  
  try {
    // Test database connection
    console.log('📡 Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful!\n');
    
    // Get the default tenant (use your specific tenant ID)
    const tenantId = process.env.TENANT_ID || '00000000-0000-0000-0000-000000000001';
    console.log(`🏢 Using tenant: ${tenantId}\n`);
    
    // Create Driver user
    console.log('👤 Creating Driver user...');
    
    const driverUser = {
      email: 'driver.test@example.com',
      phone: '+1-555-0123',
      passwordHash: '$2b$10$UXw6fWI5SHTnn3J0kRPUv.jNIwQ/97WdBO4RXeecC37MX887hMfJC', // password: test123
      role: 'DRIVER',
      status: 'ACTIVE'
    };
    
    // Insert user
    const userResult = await pool.query(`
      INSERT INTO users (id, "tenantId", email, phone, "passwordHash", role, status, "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET
        role = EXCLUDED.role,
        status = EXCLUDED.status,
        "updatedAt" = NOW()
      RETURNING id, email, role
    `, [tenantId, driverUser.email, driverUser.phone, driverUser.passwordHash, driverUser.role, driverUser.status]);
    
    const userId = userResult.rows[0].id;
    console.log(`✅ Created/Updated user: ${driverUser.email} (${driverUser.role}) - ID: ${userId}`);
    
    // Create user profile
    console.log('👤 Creating Driver profile...');
    
    const driverProfile = {
      firstName: 'Alex',
      lastName: 'Driver',
      companyName: 'Professional Driving Services',
      address: '123 Driver Lane, Houston, TX 77001',
      country: 'USA',
      postalCode: '77001',
      kycStatus: 'VERIFIED'
    };
    
    await pool.query(`
      INSERT INTO user_profiles (id, "userId", "tenantId", "firstName", "lastName", "companyName", 
                               address, "postalCode", "countryCode", "kycStatus", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      ON CONFLICT ("userId") DO UPDATE SET
        "firstName" = EXCLUDED."firstName",
        "lastName" = EXCLUDED."lastName",
        "companyName" = EXCLUDED."companyName",
        address = EXCLUDED.address,
        "postalCode" = EXCLUDED."postalCode",
        "countryCode" = EXCLUDED."countryCode",
        "kycStatus" = EXCLUDED."kycStatus",
        "updatedAt" = NOW()
    `, [userId, tenantId, driverProfile.firstName, driverProfile.lastName, driverProfile.companyName,
        driverProfile.address, driverProfile.postalCode, driverProfile.country, driverProfile.kycStatus]);
    
    console.log(`✅ Created/Updated profile for: ${driverProfile.firstName} ${driverProfile.lastName}`);
    
    // Display login credentials
    console.log('\n🎯 Driver User Created Successfully!');
    console.log('=====================================');
    console.log(`Email: ${driverUser.email}`);
    console.log(`Password: test123`);
    console.log(`Role: ${driverUser.role}`);
    console.log(`User ID: ${userId}`);
    console.log(`Tenant ID: ${tenantId}`);
    console.log('=====================================');
    console.log('\n💡 You can now login with these credentials in the frontend');
    
  } catch (error) {
    console.error('❌ Error creating driver user:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
createDriverUser().catch(console.error);
